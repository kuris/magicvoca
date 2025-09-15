
import React, { useState } from 'react';

interface HeaderProps {
  category: string;
  setCategory: (cat: string) => void;
}

const LANGUAGES = [
  { code: 'US', label: 'US', flag: '/flags/us.png', available: true },
  { code: 'KR', label: 'KR', flag: '/flags/kr.png', available: true },
  { code: 'TH', label: 'TH', flag: '/flags/th.png', available: true },
];

const HANJA_CATEGORIES = [
  { key: 'hanja-8', label: '8급', available: true },
  { key: 'hanja-7', label: '7급', available: true },
  { key: 'hanja-6', label: '6급', available: true },
  { key: 'hanja-5', label: '5급', available: true },
  { key: 'hanja-4', label: '4급', available: true },
  { key: 'hanja-3', label: '3급', available: true },
  { key: 'hanja-2', label: '2급', available: true },
  { key: 'hanja-1', label: '1급', available: true },
  { key: 'hanja-special', label: '특급', available: true },
];

export const Header: React.FC<HeaderProps> = ({ category, setCategory }) => {
  // 일반 공유하기 버튼: 소개글 + 링크
  const handleShare = () => {
    const intro = 'MagicVoca는 다양한 언어의 단어를 쉽고 재미있게 학습할 수 있는 서비스입니다.\n';
    const link = window.location.href;
    navigator.clipboard.writeText(`${intro}${link}`);
    alert('소개글과 링크가 복사되었습니다! 친구에게 공유해보세요.');
  };
  const [selectedLang, setSelectedLang] = useState('US');
  const [selectedTab, setSelectedTab] = useState<'language' | 'hanja'>('language');

  // category가 바뀌면 selectedLang과 selectedTab도 동기화
  React.useEffect(() => {
    const catObj = allCategories.find(cat => cat.key === category);
    if (catObj && catObj.lang !== selectedLang) {
      setSelectedLang(catObj.lang);
      setSelectedTab('language');
    }
    
    // 한자 카테고리인지 확인
    const isHanjaCategory = HANJA_CATEGORIES.some(cat => cat.key === category);
    if (isHanjaCategory && selectedTab !== 'hanja') {
      setSelectedTab('hanja');
    }
  }, [category]);

  // 언어 선택 시 첫 번째 카테고리 자동 선택
  const handleLangSelect = (langCode: string) => {
    setSelectedLang(langCode);
    setSelectedTab('language');
    // 항상 해당 언어의 첫 카테고리로 변경
    const filtered = allCategories.filter(cat => cat.lang === langCode);
    if (filtered.length > 0) {
      setCategory(filtered[0].key);
    }
  };

  // 한자 탭 선택 시
  const handleHanjaSelect = () => {
    setSelectedTab('hanja');
    // 첫 번째 사용 가능한 한자 카테고리로 변경
    const availableHanja = HANJA_CATEGORIES.find(cat => cat.available);
    if (availableHanja) {
      setCategory(availableHanja.key);
    }
  };
  // 영어 관련 카테고리만 보여주기 (US 선택 시)
  const allCategories = [
    { key: 'toeic', label: 'TOEIC', available: true, lang: 'US' },
    { key: 'toefl', label: 'TOEFL', available: true, lang: 'US' },
    { key: 'suneung', label: '수능', available: true, lang: 'US' },
    { key: 'gongmuwon', label: '공무원', available: true, lang: 'US' },
    { key: 'gtelp', label: 'GTELP', available: true, lang: 'US' },
    { key: 'kr-en-basic', label: selectedLang === 'KR' ? '일반회화' : '기초한국어', available: true, lang: 'KR' },
    { key: 'thai-conversation', label: '태국어회화', available: true, lang: 'TH' },
  ];
  type Category = { key: string; label: string; available: boolean; lang: string };
  let categories: Category[] = [];
  
  if (selectedTab === 'hanja') {
    // 한자 카테고리들을 Category 타입으로 변환
    categories = HANJA_CATEGORIES.map(cat => ({ ...cat, lang: 'HANJA' }));
  } else if (selectedLang === 'US') {
    categories = allCategories.filter(cat => cat.lang === 'US');
  } else if (selectedLang === 'KR') {
    categories = allCategories.filter(cat => cat.lang === 'KR');
  } else if (selectedLang === 'TH') {
    categories = allCategories.filter(cat => cat.lang === 'TH');
  } else {
    categories = [];
  }
  return (
    <header className="bg-gradient-to-r from-purple-400 to-pink-300 shadow-lg p-4 flex flex-col items-center rounded-b-3xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl font-bold text-white drop-shadow">MagicVoca</span>
        <span className="text-xl">✨</span>
        <button
          onClick={handleShare}
          className="ml-2 px-3 py-1 rounded-full bg-white text-purple-600 font-bold shadow hover:bg-purple-100 text-sm"
          title="공유하기"
        >
          공유하기
        </button>
        <button
          onClick={()=>window.location.href='/question'}
          className="px-3 py-1 rounded-full bg-white text-blue-600 font-bold shadow hover:bg-blue-100 text-sm"
          title="문의하기"
          style={{marginLeft:'4px'}}
        >
          문의하기
        </button>
      </div>
      <div className="flex flex-col items-center w-full mb-2">
        <span className="text-white font-semibold mb-1">🌐 카테고리 선택</span>
        
        {/* 언어/한자 탭 선택 */}
        <div className="flex gap-2 mb-2">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide whitespace-nowrap justify-center">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`min-w-[60px] font-semibold px-2 py-1 rounded-full transition-colors whitespace-nowrap flex items-center gap-1
                  ${selectedTab === 'language' && selectedLang === lang.code ? 'bg-white text-purple-600 font-bold' : ''}
                  ${lang.available ? 'bg-white text-purple-600 hover:bg-purple-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
                disabled={!lang.available}
                onClick={() => lang.available && handleLangSelect(lang.code)}
              >
                <img src={lang.flag} alt={lang.label + ' flag'} className="w-6 h-6" />
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
          
          {/* 한자 탭 */}
          <button
            className={`min-w-[60px] font-semibold px-3 py-1 rounded-full transition-colors whitespace-nowrap
              ${selectedTab === 'hanja' ? 'bg-white text-purple-600 font-bold' : 'bg-white text-purple-600 hover:bg-purple-100'}
            `}
            onClick={handleHanjaSelect}
          >
            <span>📜 한자</span>
          </button>
        </div>
      </div>
      <nav
        className={
          `flex w-full bg-white rounded-full px-2 sm:px-4 py-1 shadow gap-0.5 sm:gap-2 overflow-x-auto scrollbar-hide max-w-full`
        }
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`min-w-[70px] sm:min-w-[120px] font-semibold px-2 sm:px-4 py-1 rounded-full transition-colors whitespace-nowrap mx-1
              ${category === cat.key ? 'bg-purple-100 text-purple-700' : 'text-purple-600 hover:bg-purple-100'}
              ${!cat.available ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
            `}
            onClick={() => cat.available && setCategory(cat.key)}
            disabled={!cat.available}
          >
            {cat.label}
          </button>
        ))}
      </nav>
    </header>
  );
};