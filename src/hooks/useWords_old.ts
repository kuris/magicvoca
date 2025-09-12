import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Word } from '../types';

const WORDS_PER_PAGE = 50;

// 해시태그(다중 카테고리) 로드 함수
async function loadHashtagsForWords(words: Word[]) {
  try {
    const englishWords = words.map(w => w.english);
    console.log('=== 해시태그 로드 시작 ===');
    console.log('영어 단어들:', englishWords.slice(0, 5));
    
    // word_hashtags에서 해당 단어들의 해시태그 정보 가져오기
    const { data: hashtagData, error: hashtagError } = await supabase
      .from('word_hashtags')
      .select('english, hashtag')
      .in('english', englishWords);
    
    console.log('word_hashtags 데이터:', hashtagData?.length || 0, '개');
    console.log('word_hashtags 샘플:', hashtagData?.slice(0, 5));
    
    if (hashtagError) {
      console.error('Error loading hashtags:', hashtagError);
      return;
    }

    // 단어별로 해시태그 그룹화
    const hashtagMap = new Map<string, string[]>();
    hashtagData?.forEach(item => {
      if (!hashtagMap.has(item.english)) {
        hashtagMap.set(item.english, []);
      }
      hashtagMap.get(item.english)!.push(item.hashtag);
    });

    console.log('해시태그 맵 생성 완료, 단어 수:', hashtagMap.size);
    console.log('샘플 해시태그:', Array.from(hashtagMap.entries()).slice(0, 3));

    // words 배열에 해시태그 추가
    let successCount = 0;
    words.forEach(word => {
      const hashtags = hashtagMap.get(word.english) || [];
      (word as any).hashtags = hashtags;
      if (hashtags.length > 0) {
        successCount++;
        if (successCount <= 3) { // 처음 3개만 로그
          console.log(`${word.english}: ${hashtags.join(', ')}`);
        }
      }
    });

    console.log(`해시태그 할당 완료: ${successCount}/${words.length} 단어에 해시태그 적용`);
    console.log('=== 해시태그 로드 완료 ===');
  } catch (error) {
    console.error('Error in loadHashtagsForWords:', error);
  }
}

export function useWords(category: string) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allWordsData, setAllWordsData] = useState<Word[]>([]);

  useEffect(() => {
    async function fetchAllWords() {
      setLoading(true);
      setError(null);
      
      try {
        // 한국어와 태국어, TOEIC, 수능, TOEFL, 공무원, GTELP은 기존 운영사이트 방식 사용 (category 컬럼으로 직접 필터링)
        if (category === 'kr-en-basic' || category === 'thai-conversation' || 
            category === 'toeic' || category === 'suneung' || 
            category === 'toefl' || category === 'gongmuwon' || category === 'gtelp') {
          console.log(`Loading ${category} words using legacy method`);
          
          // 기존 방식: category 컬럼으로 직접 필터링
          const { data: firstData, error: firstError } = await supabase
            .from('words')
            .select('*')
            .eq('category', category)
            .order('id', { ascending: true })
            .range(0, 49);

          if (firstError) {
            console.error(`Error fetching ${category} words:`, firstError);
            setError(firstError.message);
            setLoading(false);
            return;
          }

          const firstWords: Word[] = (firstData || []).map((w: any) => ({
            id: w.id,
            english: w.english,
            korean: w.korean,
            pronunciation: w.pronunciation,
            partOfSpeech: w.part_of_speech,
            tip: w.tip,
            categories: [] // 해시태그는 별도로 로드
          }));

          // 해시태그(다중 카테고리) 정보 추가 로드
          if (firstWords.length > 0) {
            await loadHashtagsForWords(firstWords);
          }

          // 디버깅: 일반 학습 모드에서의 데이터 순서 확인
          console.log(`=== ${category} 일반 학습 모드 디버깅 ===`);
          console.log('첫 10개 단어의 ID와 데이터:');
          firstWords.slice(0, 10).forEach((word, index) => {
            console.log(`Index ${index}: ID=${word.id}, English="${word.english}", Korean="${word.korean}"`);
          });
          
          // ID 1, 2, 3번 단어 특별 확인
          [1, 2, 3].forEach(id => {
            const word = firstWords.find(w => w.id === id);
            if (word) {
              console.log(`ID ${id} 찾음: English="${word.english}", Korean="${word.korean}"`);
            } else {
              console.log(`ID ${id} 없음`);
            }
          });

          // 디버깅: 데이터베이스에서 가져온 원본 데이터 확인
          console.log('useWords - Raw data from database (first 3):', firstData?.slice(0, 3));
          console.log('useWords - Mapped words (first 3):', firstWords.slice(0, 3));
          
          // ID 2번 단어 특별 확인
          const rawWord2 = firstData?.find((w: any) => w.id === 2);
          const mappedWord2 = firstWords.find(w => w.id === 2);
          console.log('useWords - Raw word ID 2:', rawWord2);
          console.log('useWords - Mapped word ID 2:', mappedWord2);

          console.log(`${category} words loaded: ${firstWords.length} words`);
          setWords(firstWords);
          setLoading(false);

          // 백그라운드에서 나머지 불러오기 (기존 방식)
          loadLegacyWordsInBackground(category, firstWords);
          return;
        }

        // 영어 시험 카테고리들은 다중 카테고리 시스템 사용
        console.log('Loading categories and word relationships...');
        
        // Supabase 제한을 피하기 위해 여러 배치로 가져오기
        let allWordCategoriesData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        
        while (true) {
          const { data: batch, error: batchError } = await supabase
            .from('word_categories')
            .select('word_id, category_id')
            .range(from, from + batchSize - 1);
          
          if (batchError) {
            console.error('Error fetching word_categories batch:', batchError);
            break;
          }
          
          if (!batch || batch.length === 0) {
            break;
          }
          
          allWordCategoriesData = allWordCategoriesData.concat(batch);
          
          if (batch.length < batchSize) {
            break; // 마지막 배치
          }
          
          from += batchSize;
        }

        const wordCategoriesData = allWordCategoriesData;
        
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('id, name');

        console.log('Word categories data:', wordCategoriesData?.length || 0, 'relationships');
        console.log('Categories data:', categoriesData);

        if (catError) {
          console.error('Error fetching categories:', catError);
          setError('Failed to fetch categories');
          setLoading(false);
          return;
        }

        // 카테고리 매핑 생성
        const categoryMap = new Map();
        if (categoriesData) {
          categoriesData.forEach((cat: any) => {
            categoryMap.set(cat.id, cat.name);
          });
        }

        // 단어별 카테고리 매핑 생성
        const wordCategoryMap = new Map();
        if (wordCategoriesData) {
          wordCategoriesData.forEach((wc: any) => {
            if (!wordCategoryMap.has(wc.word_id)) {
              wordCategoryMap.set(wc.word_id, []);
            }
            const categoryName = categoryMap.get(wc.category_id);
            if (categoryName) {
              wordCategoryMap.get(wc.word_id).push(categoryName);
            }
          });
        }

        // 카테고리 필터링 적용하여 word_id 추출
        let filteredWordCategories = wordCategoriesData || [];
        
        if (category && categoriesData) {
          const targetCategory = categoriesData.find((cat: any) => cat.name.toLowerCase() === category.toLowerCase());
          if (targetCategory) {
            filteredWordCategories = wordCategoriesData?.filter((wc: any) => wc.category_id === targetCategory.id) || [];
            console.log(`Found category ${category} with ${filteredWordCategories.length} word relationships`);
          } else {
            console.log(`Category ${category} not found`);
            setWords([]);
            setTotalAvailable(0);
            setLoading(false);
            return;
          }
        }

        // 필터링된 단어 ID들 추출
        const wordIds = filteredWordCategories.map((wc: any) => wc.word_id);
        console.log(`Total word IDs to fetch: ${wordIds.length}`);

        if (wordIds.length === 0) {
          setWords([]);
          setTotalAvailable(0);
          setLoading(false);
          return;
        }

        // 첫 50개 단어 가져오기
        const firstBatch = wordIds.slice(0, WORDS_PER_PAGE);
        
        const { data: firstWordsData, error: firstWordsError } = await supabase
          .from('words')
          .select('id, english, korean, pronunciation, part_of_speech, tip')
          .in('id', firstBatch)
          .order('id', { ascending: true });

        if (firstWordsError) {
          console.error('Error fetching first batch:', firstWordsError);
          setError(firstWordsError.message);
          setLoading(false);
          return;
        }

        // 첫 배치 단어들 (카테고리 해시태그 포함)
        const firstWords: Word[] = (firstWordsData || []).map((w: any) => ({
          id: w.id,
          english: w.english,
          korean: w.korean,
          pronunciation: w.pronunciation,
          partOfSpeech: w.part_of_speech,
          tip: w.tip,
          categories: wordCategoryMap.get(w.id) || []
        }));

        console.log(`First batch loaded: ${firstWords.length} words`);
        setWords(firstWords);
        setTotalAvailable(wordIds.length);
        setLoading(false);

        // 나머지 단어들을 백그라운드에서 로딩
        if (wordIds.length > WORDS_PER_PAGE) {
          setHasMore(true);
          loadRemainingWordsInBackground(wordIds.slice(WORDS_PER_PAGE), wordCategoryMap);
        } else {
          setHasMore(false);
        }

      } catch (err) {
        console.error('Error loading words:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
        setLoading(false);
      }
    }

    // 기존 운영사이트 방식으로 나머지 단어들 백그라운드 로딩
    async function loadLegacyWordsInBackground(dbCategory: string, initialWords: Word[]) {
      try {
        console.log(`Loading remaining ${dbCategory} words in background...`);
        
        let allWords = [...initialWords];
        let offset = 50;
        const pageSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('category', dbCategory)
            .order('id', { ascending: true })
            .range(offset, offset + pageSize - 1);

          if (error) {
            console.error(`Error fetching ${dbCategory} background batch:`, error);
            break;
          }

          if (data && data.length > 0) {
            const newWords: Word[] = data.map((w: any) => ({
              id: w.id,
              english: w.english,
              korean: w.korean,
              pronunciation: w.pronunciation,
              partOfSpeech: w.part_of_speech,
              tip: w.tip,
              categories: [] // 해시태그는 별도로 로드
            }));

            // 백그라운드 로드된 단어들에도 해시태그 추가
            if (newWords.length > 0) {
              await loadHashtagsForWords(newWords);
            }

            allWords = allWords.concat(newWords);
            setWords([...allWords]); // 실시간으로 추가
            setTotalAvailable(allWords.length);
            
            hasMore = data.length === pageSize;
            offset += pageSize;
          } else {
            hasMore = false;
          }
        }
        
        console.log(`Background loading completed: ${allWords.length} total ${dbCategory} words`);
        setHasMore(false);

      } catch (err) {
        console.error(`Error loading ${dbCategory} words:`, err);
      }
    }

    async function loadRemainingWordsInBackground(wordIds: number[], wordCategoryMap: Map<number, string[]>) {
      try {
        console.log('Loading remaining words in background...');
        
        // 나머지 단어들을 배치로 나누기
        const batchSize = 1000;
        const batches = [];
        for (let i = 0; i < wordIds.length; i += batchSize) {
          batches.push(wordIds.slice(i, i + batchSize));
        }

        let allRemainingData: any[] = [];
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(`Loading background batch ${i + 1}/${batches.length} (${batch.length} words)`);
          
          const { data: batchData, error: batchError } = await supabase
            .from('words')
            .select('id, english, korean, pronunciation, part_of_speech, tip')
            .in('id', batch)
            .order('id', { ascending: true });

          if (batchError) {
            console.error(`Error fetching background batch ${i + 1}:`, batchError);
            continue;
          }

          if (batchData) {
            allRemainingData = allRemainingData.concat(batchData);
          }
        }

        // 모든 단어 데이터 변환
        const allWords: Word[] = allRemainingData.map((w: any) => ({
          id: w.id,
          english: w.english,
          korean: w.korean,
          pronunciation: w.pronunciation,
          partOfSpeech: w.part_of_speech,
          tip: w.tip,
          categories: wordCategoryMap.get(w.id) || []
        }));

        console.log(`Background loading completed: ${allWords.length} additional words loaded`);
        setAllWordsData(allWords);

      } catch (err) {
        console.error('Error loading remaining words:', err);
      }
    }

    fetchAllWords();
  }, [category]);

  // 더 많은 단어 로드 (레이지 로딩)
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextBatch = allWordsData.slice(0, WORDS_PER_PAGE);
    
    if (nextBatch.length > 0) {
      setWords([...words, ...nextBatch]);
      setAllWordsData(allWordsData.slice(WORDS_PER_PAGE));
      
      if (allWordsData.length <= WORDS_PER_PAGE) {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  return { 
    words, 
    loading, 
    loadingMore,
    hasMore,
    error, 
    loadMore,
    totalWords: totalAvailable
  };
}
