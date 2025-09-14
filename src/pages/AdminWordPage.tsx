import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Word {
  id: number;
  english: string;
  korean: string;
  // 필요한 추가 필드
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
    if (category === 'english' && search.trim()) {
      setLoading(true);
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .ilike('english', `%${search.trim()}%`);
      if (error) setError(error.message);
      else setWords(data || []);
      setFilter(search);
      setLoading(false);
    } else {
      setFilter(search);
    }
  };

  const filteredWords = filter
    ? words.filter(word => {
        const searchValue = filter.trim().toLowerCase();
        if (category === 'english') {
          const english = (word.english || '').toString().trim().toLowerCase();
          return english.includes(searchValue);
        } else {
          const korean = (word.korean || '').toString().trim().toLowerCase();
          return korean.includes(searchValue);
        }
      })
    : words;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>잘못된 단어/뜻 관리</h2>
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
