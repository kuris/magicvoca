import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Word {
  id: number;
  english: string;
  korean: string;
  is_toeic?: boolean;
  is_toefl?: boolean;
  is_suneung?: boolean;
  is_gongmuwon?: boolean;
  is_gtelp?: boolean;
}

export default function AdminWordPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editEnglish, setEditEnglish] = useState('');
  const [editKorean, setEditKorean] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'english' | 'korean'>('english');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['TOEIC', 'TOEFL', '수능', '공무원', 'GTELP']);

  const categoryList = [
    { key: 'TOEIC', label: 'TOEIC' },
    { key: 'TOEFL', label: 'TOEFL' },
    { key: '수능', label: '수능' },
    { key: '공무원', label: '공무원' },
    { key: 'GTELP', label: 'GTELP' },
  ];

  const handleCategoryCheckbox = (key: string) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };
  useEffect(() => {
    // 모든 단어 불러오기
    supabase
      .from('words')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else {
          setWords(data || []);
          // 검색 결과가 있으면 자동으로 첫 번째 단어 수정모드 진입
          if (data && data.length > 0) {
            setEditId(data[0].id);
            setEditEnglish(data[0].english || '');
            setEditKorean(data[0].korean || '');
          }
        }
        setLoading(false);
      });
  }, []);

  const handleEdit = (word: Word) => {
    setEditId(word.id);
    setEditEnglish(word.english || '');
    setEditKorean(word.korean || '');
  };

  const handleSave = async () => {
    if (!editId) return;
    const { error } = await supabase
      .from('words')
      .update({ english: editEnglish, korean: editKorean })
      .eq('id', editId);
    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      setWords(words.map(w => w.id === editId ? { ...w, english: editEnglish, korean: editKorean } : w));
      setEditId(null);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  // 검색 버튼 클릭 시 필터 적용
  // 검색 버튼 또는 엔터키로 필터 적용
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    let query = supabase.from('words').select('*');
    // 카테고리별 조건 추가
    if (selectedCategories.length > 0) {
      // 여러 카테고리 OR 조건
      const orConditions = selectedCategories.map(cat => {
        if (cat === 'TOEIC') return 'is_toeic.eq.true';
        if (cat === 'TOEFL') return 'is_toefl.eq.true';
        if (cat === '수능') return 'is_suneung.eq.true';
        if (cat === '공무원') return 'is_gongmuwon.eq.true';
        if (cat === 'GTELP') return 'is_gtelp.eq.true';
        return '';
      }).filter(Boolean).join(',');
      if (orConditions) {
        query = query.or(orConditions);
      }
    }
    // 검색어가 있으면 추가 조건
    if (search.trim()) {
      if (category === 'english') {
        query = query.ilike('english', `%${search.trim()}%`);
      } else {
        query = query.ilike('korean', `%${search.trim()}%`);
      }
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    else setWords(data || []);
    setFilter(search);
    setLoading(false);
  };

  // 카테고리 필터링 (단어 객체에 각 카테고리별 boolean 필드가 있다고 가정)
  const filteredWords = words.filter(word => {
    // 각 단어에 is_toeic, is_toefl, is_suneung, is_gongmuwon, is_gtelp 필드가 있다고 가정
    const categoryMap: Record<string, boolean> = {
      TOEIC: !!word.is_toeic,
      TOEFL: !!word.is_toefl,
      수능: !!word.is_suneung,
      공무원: !!word.is_gongmuwon,
      GTELP: !!word.is_gtelp,
    };
    // 선택된 카테고리 중 하나라도 true면 표시
    return selectedCategories.some(cat => categoryMap[cat]);
  }).filter(word => {
    if (!filter) return true;
    const searchValue = filter.trim().toLowerCase();
    if (category === 'english') {
      const english = (word.english || '').toString().trim().toLowerCase();
      return english.includes(searchValue);
    } else {
      const korean = (word.korean || '').toString().trim().toLowerCase();
      return korean.includes(searchValue);
    }
  });

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>잘못된 단어/뜻 관리</h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {categoryList.map(cat => (
          <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.key)}
              onChange={() => handleCategoryCheckbox(cat.key)}
            />
            {cat.label}
          </label>
        ))}
      </div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as 'english' | 'korean')}
          style={{ padding: '8px', fontSize: '16px', borderRadius: 4, border: '1px solid #e5e7eb' }}
        >
          <option value="english">영어</option>
          <option value="korean">한글</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={category === 'english' ? '영어로 검색' : '한글로 검색'}
          style={{ flex: 1, padding: '8px', fontSize: '16px', borderRadius: 4, border: '1px solid #e5e7eb' }}
        />
        <button type="submit" style={{ padding: '8px 16px', fontSize: '16px', borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none' }}>검색</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>영어</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>한글</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>수정</th>
          </tr>
        </thead>
        <tbody>
          {filteredWords.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: 16, color: '#888' }}>
                {words.length === 0 ? '단어 데이터가 없습니다.' : '검색 결과가 없습니다.'}
              </td>
            </tr>
          ) : (
            filteredWords.map(word => (
              <tr key={word.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                  <input value={editId === word.id ? editEnglish : word.english} onChange={e => setEditEnglish(e.target.value)} />
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                  <input value={editId === word.id ? editKorean : word.korean} onChange={e => setEditKorean(e.target.value)} />
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setEditId(word.id); setEditEnglish(word.english || ''); setEditKorean(word.korean || ''); }}
                    style={{ padding: '6px 16px', fontSize: '15px', borderRadius: 4, background: '#e5e7eb', color: '#333', border: 'none', cursor: 'pointer' }}
                  >수정</button>
                  {editId === word.id && (
                    <button
                      onClick={handleSave}
                      style={{ padding: '6px 16px', fontSize: '15px', borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >저장</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
