import React, { useState } from 'react';
import { Word } from '../types';

interface QuizCardProps {
  word: Word;
  options: string[];
  category?: string;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  total: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({ word, options, category, onNext, onPrev, currentIndex, total }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 문제 이동 시 선택 상태 초기화
  React.useEffect(() => {
    setSelected(null);
    setShowResult(false);
  }, [word]);

    // 숫자키(1~4)로 바로 선택 가능하게
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!showResult && e.key >= '1' && e.key <= '4') {
          const idx = parseInt(e.key, 10) - 1;
          if (options[idx]) {
            setSelected(options[idx]);
            setShowResult(true);
          }
        }
        // 이전 버튼: q, Q, ㅂ (항상 동작)
        if (e.key === 'q' || e.key === 'Q' || e.key === 'ㅂ') {
          setSelected(null);
          setShowResult(false);
          onPrev();
        }
        // 다음 버튼: r, R, ㄱ (항상 동작)
        if (e.key === 'r' || e.key === 'R' || e.key === 'ㄱ') {
          setSelected(null);
          setShowResult(false);
          onNext();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [options, showResult]);

  const handleSelect = (option: string) => {
    if (!showResult) {
      setSelected(option);
      setShowResult(true);
    }
  };

  // 문제/보기 언어 분기
  const isKoreanBasic = category === 'kr-en-basic';
  const isThaiConversation = category === 'thai-conversation';
  const isHanjaCategory = category && category.startsWith('hanja-');
  // 태국어회화: 문제는 한국어 뜻, 정답은 태국어 발음
  const quizQuestion = isThaiConversation ? word.korean : (isKoreanBasic ? word.korean : word.english);
  const correctAnswer = isHanjaCategory
    ? `${word.korean || ''} / ${word.pronunciation || ''}`
    : (isThaiConversation ? word.pronunciation : (isKoreanBasic ? word.english : word.korean));
  const isCorrect = selected === correctAnswer;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-8 border border-gray-100 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-500 text-sm">{currentIndex + 1} / {total}</span>
        <div className="flex gap-2">
          <button onClick={() => { setSelected(null); setShowResult(false); onPrev(); }} className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs sm:text-base">이전</button>
          <button onClick={() => { setSelected(null); setShowResult(false); onNext(); }} className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 hover:bg-gray-300 text-xs sm:text-base">다음</button>
        </div>
      </div>
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 break-words">{quizQuestion}</h1>
        <p className="text-base sm:text-lg text-gray-500">
          {isThaiConversation
            ? '한국어 뜻에 맞는 태국어 발음을 고르세요'
            : (isKoreanBasic ? '다음 단어의 영어 뜻을 고르세요' : '다음 단어의 뜻을 고르세요')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(option)}
            className={`w-full p-3 sm:p-4 rounded-lg border text-base sm:text-lg font-medium transition-all duration-200
              ${selected === option ? (isCorrect ? 'bg-green-100 border-green-400' : 'bg-purple-100 border-purple-400') : 'bg-gray-50 border-gray-200'}
              ${showResult && correctAnswer === option ? 'border-green-500' : ''}
            `}
            disabled={showResult}
          >
            {`${idx + 1}. ${option}`}
          </button>
        ))}
      </div>
      {showResult && (
        <div className={`mt-4 p-3 sm:p-4 rounded-lg text-center ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {isCorrect ? (
            <>
              <span className="font-bold text-base sm:text-xl">✔ 정답입니다!</span>
            </>
          ) : (
            <>
              <span className="font-bold text-base sm:text-xl">✘ 틀렸습니다</span><br />
              정답: "{correctAnswer}". 다시 한번 도전해보세요!
            </>
          )}
        </div>
      )}
    </div>
  );
};
