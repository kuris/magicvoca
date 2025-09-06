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
  const [mode, setMode] = useState<'study' | 'quiz'>('study');
  // 탭 key와 DB category 매핑
  const tabToCategory: Record<string, string> = {
    toeic: 'toeic',
    toefl: 'toefl',
    suneung: 'suneung',
    gongmuwon: 'gongmuwon',
    gtelp: 'gtelp',
    'kr-en-basic': 'kr-en-basic',
  };
  const [tab, setTab] = useState('toeic');
  const category = tabToCategory[tab];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { words, loading: wordsLoading, error: wordsError } = useWords(category);
  const currentWord = words[currentWordIndex];

  // 단어 리스트가 바뀔 때마다 랜덤 인덱스 선택
  React.useEffect(() => {
    if (words.length > 0) {
      setCurrentWordIndex(0);
    }
  }, [words]);
  // Always call useComments, even if currentWord is undefined
  const { comments, loading, error, addComment, deleteComment, refetch } = useComments(currentWord?.id);

  // Only render loading/error/empty after all hooks
  if (wordsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading words...</div>;
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
  setCurrentWordIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
  setCurrentWordIndex((prev) => Math.min(words.length - 1, prev + 1));
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Header category={tab} setCategory={setTab} />
          <div className="flex gap-2 mb-6 justify-end">
            <button
              className={`px-4 py-2 rounded-lg font-bold ${mode === 'study' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setMode('study')}
            >학습</button>
            <button
              className={`px-4 py-2 rounded-lg font-bold ${mode === 'quiz' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setMode('quiz')}
            >퀴즈</button>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-medium">오류가 발생했습니다:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {mode === 'study' ? (
            <>
              <WordNavigation
                currentIndex={currentWordIndex}
                totalWords={words.length}
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
              options={getQuizOptions(words, currentWordIndex)}
              onNext={handleNext}
              onPrev={handlePrevious}
              currentIndex={currentWordIndex}
              total={words.length}
            />
          )}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              💪 꾸준한 학습이 성공의 열쇠입니다 | Made with ❤️ for English learners
            </p>
          </div>
        </div>
      </div>
      <Analytics />
    </>
  );
}

export default App;