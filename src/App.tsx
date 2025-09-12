import { Analytics } from "@vercel/analytics/react";
import React, { useState } from 'react';
import { WordCard } from './components/WordCard';
import { getQuizOptions } from './getQuizOptions';
import { Word } from './types';
import { QuizCard } from './components/QuizCard';
import { CommentSection } from './components/CommentSection';
import { WordNavigation } from './components/WordNavigation';
import { Header } from './components/Header';
import { useWords } from './hooks/useWords';
import { useComments } from './hooks/useComments';

function App() {
  const [mode, setMode] = useState<'study' | 'quiz' | 'random-study' | 'random-quiz'>('study');
  // 탭 key와 DB category 매핑
  const tabToCategory: Record<string, string> = {
    toeic: 'toeic',
    toefl: 'toefl',
    suneung: 'suneung',
    gongmuwon: 'gongmuwon',
    gtelp: 'gtelp',
    'kr-en-basic': 'kr-en-basic',
    'thai-conversation': 'thai-conversation',
    'hanja-basic': 'hanja-basic',
    'hanja-middle': 'hanja-middle',
    'hanja-advanced': 'hanja-advanced',
    'random-study': 'toeic', // 기본값, 실제 랜덤은 아래에서 처리
    'random-quiz': 'toeic', // 기본값, 실제 랜덤은 아래에서 처리
  };
  const [tab, setTab] = useState('toeic');
  // mode에 따라 tab을 자동으로 맞추는 대신, tab은 카테고리만 담당
  const category = tabToCategory[tab];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { words, loading: wordsLoading, error: wordsError, totalWords } = useWords(category);
  
  // currentWordIndex가 words 범위를 벗어나지 않도록 보정
  const safeCurrentIndex = words.length > 0 ? Math.min(currentWordIndex, words.length - 1) : 0;
  const currentWord = words[safeCurrentIndex];
  
  // 인덱스가 범위를 벗어났을 때 보정
  React.useEffect(() => {
    if (words.length > 0 && currentWordIndex >= words.length) {
      console.log(`인덱스 보정: ${currentWordIndex} -> ${words.length - 1} (총 ${words.length}개 단어)`);
      setCurrentWordIndex(words.length - 1);
    }
  }, [words.length, currentWordIndex]);

  // 단어 리스트가 바뀔 때마다 인덱스 초기화 (랜덤탭이면 랜덤)
  React.useEffect(() => {
    if (words.length > 0) {
      console.log(`모드 변경/단어 로드: mode=${mode}, category=${category}, words.length=${words.length}`);
      if (mode === 'random-study' || mode === 'random-quiz') {
        // 랜덤 모드: 현재 카테고리 내에서 랜덤 인덱스 생성
        const randomIndex = Math.floor(Math.random() * words.length);
        console.log(`랜덤 모드 초기화: ${category} 카테고리에서 ${words.length}개 단어 중 ${randomIndex}번째 선택`);
        setCurrentWordIndex(randomIndex);
      } else {
        console.log(`일반 모드 초기화: 첫 번째 단어로 설정`);
        setCurrentWordIndex(0);
      }
    }
  }, [words, mode, category]);
  // Always call useComments, even if currentWord is undefined
  const { comments, loading, error, addComment, deleteComment, refetch } = useComments(currentWord?.id);

  // Only render loading/error/empty after all hooks
  if (wordsLoading) {
    // words.length is updated as words are fetched
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="mb-2 text-lg font-semibold text-purple-600">Loading words...</div>
        <div className="text-sm text-gray-500">Fetched {words.length} / 예상 총 {words.length > 0 ? words.length : '...'} 단어</div>
        <div className="mt-2 animate-pulse text-xs text-gray-400">Please wait...</div>
      </div>
    );
  }
  // 디버그: words와 error를 화면에 출력
  if (wordsError || !currentWord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600">
        <div>Error loading words: {typeof wordsError === 'string' ? wordsError : JSON.stringify(wordsError)}</div>
        <div className="mt-4 text-xs text-gray-700 bg-gray-100 p-2 rounded w-full max-w-xl">
          <strong>words 배열:</strong>
          <pre>{JSON.stringify(words, null, 2)}</pre>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    if (words.length === 0) return; // 단어가 없으면 리턴
    
    if (mode === 'random-study' || mode === 'random-quiz') {
      // 랜덤 모드: 현재 카테고리 내에서 새로운 랜덤 단어 선택
      const randomIndex = Math.floor(Math.random() * words.length);
      console.log(`랜덤 이전: ${category} 카테고리에서 총 ${words.length}개 단어 중 ${randomIndex}번째 선택`);
      setCurrentWordIndex(randomIndex);
    } else {
      setCurrentWordIndex((prev) => {
        if (prev === 0) {
          return words.length - 1;
        }
        return Math.max(0, prev - 1);
      });
    }
  };

  const handleNext = () => {
    if (words.length === 0) return; // 단어가 없으면 리턴
    
    if (mode === 'random-study' || mode === 'random-quiz') {
      // 랜덤 모드: 현재 카테고리 내에서 새로운 랜덤 단어 선택
      const randomIndex = Math.floor(Math.random() * words.length);
      console.log(`랜덤 다음: ${category} 카테고리에서 총 ${words.length}개 단어 중 ${randomIndex}번째 선택`);
      setCurrentWordIndex(randomIndex);
    } else {
      setCurrentWordIndex((prev) => {
        if (prev === words.length - 1) {
          return 0;
        }
        return Math.min(words.length - 1, prev + 1);
      });
    }
  };

  // 랜덤 기능 완전히 제거
  // ...기존 코드...

  const handleAddComment = async (wordId: number, content: string, author: string) => {
    return await addComment(wordId, content, author);
  };

  const handleDeleteComment = async (commentId: number) => {
    return await deleteComment(commentId);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 pt-2 pb-1 max-w-4xl">
          <Header category={tab} setCategory={setTab} />
          {/* 모드 버튼 */}
          <div className="flex gap-1 sm:gap-2 mb-2 justify-center">
            <button
              className={`px-1.5 sm:px-4 py-0.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${mode === 'study' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              style={{ minWidth: 40 }}
              onClick={() => setMode('study')}
            >학습</button>
            <button
              className={`px-1.5 sm:px-4 py-0.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${mode === 'quiz' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              style={{ minWidth: 40 }}
              onClick={() => setMode('quiz')}
            >퀴즈</button>
            <button
              className={`px-1.5 sm:px-4 py-0.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${mode === 'random-study' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              style={{ minWidth: 54 }}
              onClick={() => setMode('random-study')}
            >랜덤학습</button>
            <button
              className={`px-1.5 sm:px-4 py-0.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${mode === 'random-quiz' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              style={{ minWidth: 54 }}
              onClick={() => setMode('random-quiz')}
            >랜덤퀴즈</button>
          </div>
          
          {/* 쿠팡 배너 */}
          <div className="flex justify-center gap-4 mb-2">
            <div id="coupang-banner-left" style={{ minWidth: 120, minHeight: 60 }}></div>
            <div id="coupang-banner-right" style={{ minWidth: 120, minHeight: 60 }}></div>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">오류가 발생했습니다:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {(mode === 'study' || mode === 'random-study') ? (
            <>
              <WordNavigation
                currentIndex={currentWordIndex}
                totalWords={totalWords || words.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
              <WordCard word={currentWord} category={category} />
              <CommentSection
                wordId={currentWord.id}
                word={currentWord}
                comments={comments}
                loading={loading}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                refetchComments={refetch}
              />
            </>
          ) : (
            <QuizCard
              word={currentWord}
              options={getQuizOptions(words, currentWordIndex, category)}
              category={category}
              onNext={handleNext}
              onPrev={handlePrevious}
              currentIndex={currentWordIndex}
              total={totalWords || words.length}
            />
          )}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              💪 꾸준한 학습이 성공의 열쇠입니다 | Made with ❤️ for English learners
            </p>
            {/* 쿠팡 파트너스 안내문구를 페이지 최하단에 위치 (한 번만 표시) */}
            <div className="text-center mb-2 mt-8">
              <span className="text-[11px] text-gray-400">
                이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
              </span>
            </div>
          </div>
        </div>
      </div>
  {/* 안내문구는 위에서 한 번만 표시됨 */}
      <Analytics />
    </>
  );
}

export default App;