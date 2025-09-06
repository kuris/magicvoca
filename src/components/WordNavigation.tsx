import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';

interface WordNavigationProps {
  currentIndex: number;
  totalWords: number;
  onPrevious: () => void;
  onNext: () => void;
  // onRandom prop 제거
}

export const WordNavigation: React.FC<WordNavigationProps> = ({
  currentIndex,
  totalWords,
  onPrevious,
  onNext,
  // onRandom 제거
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
        <BookOpen className="text-blue-500" size={24} />
        <span>{currentIndex + 1}</span>
        <span className="text-gray-400">/</span>
        <span>{totalWords}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-700 hover:text-blue-600 border border-gray-200"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">이전</span>
        </button>
        
  {/* 랜덤 버튼 완전히 제거 */}
        
        <button
          onClick={onNext}
          disabled={currentIndex === totalWords - 1}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-gray-700 hover:text-blue-600 border border-gray-200"
        >
          <span className="hidden sm:inline">다음</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};