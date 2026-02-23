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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2 -mt-12">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
        <BookOpen className="text-blue-500" size={24} />
        <span>{currentIndex + 1}</span>
        <span className="text-gray-400">/</span>
        <span>{totalWords}</span>
      </div>
      <div className="flex items-center gap-3 w-full justify-center">
        {/* 쿠팡 이미지 배너 (모바일/데스크탑 모두 노출) */}
        <a
          href="https://link.coupang.com/a/cPIks9"
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="unsafe-url"
          style={{ minWidth: 120, minHeight: 60 }}
        >
          <img src="https://ads-partners.coupang.com/banners/919460?subId=&traceId=V0-301-f5c692db558def48-I919460&w=120&h=60" alt="쿠팡배너" style={{ width: 120, height: 60 }} />
        </a>
        <button
          onClick={onPrevious}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-blue-600 border border-gray-200"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">이전</span>
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 hover:text-blue-600 border border-gray-200"
        >
          <span className="hidden sm:inline">다음</span>
          <ChevronRight size={20} />
        </button>
        <a
          href="https://link.coupang.com/a/cPIks9"
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="unsafe-url"
          className="sm:hidden"
          style={{ minWidth: 120, minHeight: 60 }}
        >
          <img src="https://ads-partners.coupang.com/banners/919460?subId=&traceId=V0-301-f5c692db558def48-I919460&w=120&h=60" alt="쿠팡배너" style={{ width: 120, height: 60 }} />
        </a>
      </div>
    </div>
  );
};