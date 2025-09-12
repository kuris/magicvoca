-- 특정 카테고리(예: TOEFL)에서만 중복 단어 제거

-- 1단계: TOEFL 카테고리에서 중복 확인
SELECT 
    w.english,
    COUNT(*) as duplicate_count,
    STRING_AGG(w.id::text, ', ' ORDER BY w.id) as word_ids
FROM words w
JOIN word_categories wc ON w.id = wc.word_id
JOIN categories c ON wc.category_id = c.id
WHERE c.name = 'TOEFL'
GROUP BY w.english
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2단계: TOEFL 카테고리에서 중복 단어_카테고리 연결 제거 (가장 낮은 ID 제외)
WITH toefl_duplicates AS (
    SELECT 
        wc.id as word_category_id,
        ROW_NUMBER() OVER (
            PARTITION BY w.english 
            ORDER BY w.id ASC
        ) as rn
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'TOEFL'
)
DELETE FROM word_categories 
WHERE id IN (
    SELECT word_category_id 
    FROM toefl_duplicates 
    WHERE rn > 1
);

-- 3단계: 더 이상 어떤 카테고리에도 연결되지 않은 단어들 제거
DELETE FROM words 
WHERE id NOT IN (
    SELECT DISTINCT word_id 
    FROM word_categories
);

-- 4단계: TOEFL 카테고리 정리 후 확인
SELECT 
    w.english,
    COUNT(*) as count
FROM words w
JOIN word_categories wc ON w.id = wc.word_id
JOIN categories c ON wc.category_id = c.id
WHERE c.name = 'TOEFL'
GROUP BY w.english
HAVING COUNT(*) > 1;