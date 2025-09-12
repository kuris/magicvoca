import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Word } from '../types';

export function useWords(category?: string) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allWordsData, setAllWordsData] = useState<Word[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const WORDS_PER_PAGE = 50;

  useEffect(() => {
    async function fetchAllWords() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching words with category filter:', category);

        // 하이브리드 구조: 영어 카테고리는 Boolean 컬럼, THAI/KOREAN/THAI-CONVERSATION은 조인 방식
        let query;
        
        if (category && ['thai', 'korean', 'thai-conversation'].includes(category.toLowerCase())) {
          // THAI, KOREAN, THAI-CONVERSATION 카테고리는 기존 조인 방식 사용
          const categoryName = category.toLowerCase() === 'thai-conversation' ? 'THAI-CONVERSATION' : category.toUpperCase();
          query = supabase
            .from('words')
            .select(`
              id, english, korean, pronunciation, part_of_speech, tip,
              is_toeic, is_toefl, is_gtelp, is_suneung, is_gongmuwon,
              word_categories(
                categories(name)
              )
            `)
            .eq('word_categories.categories.name', categoryName);
        } else {
          // 영어 카테고리들은 Boolean 컬럼 방식 사용
          query = supabase
            .from('words')
            .select('id, english, korean, pronunciation, part_of_speech, tip, is_toeic, is_toefl, is_gtelp, is_suneung, is_gongmuwon');

          // 카테고리별 필터링
          if (category) {
            const categoryColumn = getCategoryColumn(category);
            if (categoryColumn) {
              query = query.eq(categoryColumn, true);
            } else {
              console.log(`Unknown category: ${category}`);
              setWords([]);
              setAllWordsData([]);
              setHasMore(false);
              setLoading(false);
              return;
            }
          }
        }

        // 첫 배치만 즉시 로딩
        const { data: firstBatchData, error: firstBatchError } = await query
          .order('id', { ascending: true })
          .range(0, WORDS_PER_PAGE - 1);

        if (firstBatchError) {
          console.error('Error fetching first batch:', firstBatchError);
          setError(firstBatchError.message);
          setLoading(false);
          return;
        }

        // 첫 배치 단어들 변환
        const firstWords: Word[] = (firstBatchData || []).map((w: any) => ({
          id: w.id,
          english: w.english,
          korean: w.korean,
          pronunciation: w.pronunciation,
          partOfSpeech: w.part_of_speech,
          tip: w.tip,
          categories: getWordCategories(w) // Boolean 컬럼들을 배열로 변환
        }));

        console.log(`First batch loaded: ${firstWords.length} words`);
        setWords(firstWords);
        setCurrentPage(1);
        setLoading(false);

        // 전체 데이터 개수 확인을 위해 count 쿼리 실행
        let countQuery;
        
        if (category && ['thai', 'korean', 'thai-conversation'].includes(category.toLowerCase())) {
          // THAI, KOREAN, THAI-CONVERSATION 카테고리는 조인 방식으로 count 조회
          const categoryName = category.toLowerCase() === 'thai-conversation' ? 'THAI-CONVERSATION' : category.toUpperCase();
          
          // 먼저 카테고리 ID를 찾기
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('name', categoryName)
            .single();
            
          if (categoryData) {
            countQuery = supabase
              .from('word_categories')
              .select('word_id', { count: 'exact', head: true })
              .eq('category_id', categoryData.id);
          } else {
            // 카테고리가 없으면 0개로 처리
            setHasMore(false);
            setLoading(false);
            return;
          }
        } else {
          countQuery = supabase
            .from('words')
            .select('id', { count: 'exact', head: true });

          if (category) {
            const categoryColumn = getCategoryColumn(category);
            if (categoryColumn) {
              countQuery = countQuery.eq(categoryColumn, true);
            }
          }
        }

        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error getting count:', countError);
        } else {
          const totalCount = count || 0;
          setHasMore(totalCount > WORDS_PER_PAGE);
          
          // 백그라운드에서 나머지 데이터 로딩
          if (totalCount > WORDS_PER_PAGE) {
            loadRemainingWordsInBackground(category, WORDS_PER_PAGE);
          }
        }

      } catch (err) {
        console.error('Error in fetchAllWords:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch words');
        setLoading(false);
      }
    }

    async function loadRemainingWordsInBackground(category: string | undefined, offset: number) {
      try {
        console.log('Loading remaining words in background...');
        
        let query;
        
        if (category && ['thai', 'korean', 'thai-conversation'].includes(category.toLowerCase())) {
          // THAI, KOREAN, THAI-CONVERSATION 카테고리는 기존 조인 방식 사용
          const categoryName = category.toLowerCase() === 'thai-conversation' ? 'THAI-CONVERSATION' : category.toUpperCase();
          query = supabase
            .from('words')
            .select(`
              id, english, korean, pronunciation, part_of_speech, tip,
              is_toeic, is_toefl, is_gtelp, is_suneung, is_gongmuwon,
              word_categories(
                categories(name)
              )
            `)
            .eq('word_categories.categories.name', categoryName);
        } else {
          // 영어 카테고리들은 Boolean 컬럼 방식 사용
          query = supabase
            .from('words')
            .select('id, english, korean, pronunciation, part_of_speech, tip, is_toeic, is_toefl, is_gtelp, is_suneung, is_gongmuwon');

          if (category) {
            const categoryColumn = getCategoryColumn(category);
            if (categoryColumn) {
              query = query.eq(categoryColumn, true);
            }
          }
        }

        const BATCH_SIZE = 1000;
        let allRemainingData: any[] = [];
        let currentOffset = offset;

        while (true) {
          const { data: batchData, error: batchError } = await query
            .order('id', { ascending: true })
            .range(currentOffset, currentOffset + BATCH_SIZE - 1);

          if (batchError) {
            console.error(`Error fetching background batch:`, batchError);
            break;
          }

          if (!batchData || batchData.length === 0) {
            break;
          }

          allRemainingData = allRemainingData.concat(batchData);
          
          if (batchData.length < BATCH_SIZE) {
            break; // 마지막 배치
          }
          
          currentOffset += BATCH_SIZE;
        }

        // 모든 단어 데이터 변환
        const allWords: Word[] = allRemainingData.map((w: any) => ({
          id: w.id,
          english: w.english,
          korean: w.korean,
          pronunciation: w.pronunciation,
          partOfSpeech: w.part_of_speech,
          tip: w.tip,
          categories: getWordCategories(w)
        }));

        console.log(`Background loading completed: ${allWords.length} additional words loaded`);
        setAllWordsData(allWords);

      } catch (err) {
        console.error('Error loading remaining words:', err);
      }
    }

    fetchAllWords();
    setCurrentPage(0); // 카테고리 변경 시 페이지 리셋
  }, [category]);

  // 더 많은 단어 로드 (레이지 로딩)
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    const startIndex = currentPage * WORDS_PER_PAGE;
    const endIndex = startIndex + WORDS_PER_PAGE;
    const nextWords = allWordsData.slice(startIndex, endIndex);

    if (nextWords.length > 0) {
      setWords(prevWords => [...prevWords, ...nextWords]);
      setCurrentPage(prev => prev + 1);
      
      // 더 이상 로드할 단어가 없는지 확인
      if (endIndex >= allWordsData.length) {
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
    totalWords: words.length + allWordsData.length
  };
}

// 카테고리 이름을 Boolean 컬럼명으로 변환 (영어 카테고리만)
function getCategoryColumn(category: string): string | null {
  const categoryMap: { [key: string]: string } = {
    'toeic': 'is_toeic',
    'toefl': 'is_toefl',
    'gtelp': 'is_gtelp',
    'suneung': 'is_suneung',
    'gongmuwon': 'is_gongmuwon'
  };

  // THAI, KOREAN, THAI-CONVERSATION은 조인 방식을 사용하므로 null 반환
  if (['thai', 'korean', 'thai-conversation'].includes(category.toLowerCase())) {
    return null;
  }

  return categoryMap[category.toLowerCase()] || null;
}

// Boolean 컬럼들을 카테고리 배열로 변환
function getWordCategories(word: any): string[] {
  const categories: string[] = [];
  
  // Boolean 컬럼 기반 카테고리들
  if (word.is_toeic) categories.push('TOEIC');
  if (word.is_toefl) categories.push('TOEFL');
  if (word.is_gtelp) categories.push('GTELP');
  if (word.is_suneung) categories.push('수능');
  if (word.is_gongmuwon) categories.push('공무원');
  
  // 조인 기반 카테고리들 (THAI, KOREAN)
  if (word.categories && word.categories.name) {
    categories.push(word.categories.name);
  }
  
  return categories;
}