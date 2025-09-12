-- 같은 카테고리 내에서 중복된 단어들만 찾기
-- 예: 'avoid'가 TOEIC에 2번, TOEFL에 1번 있다면 TOEIC의 중복만 제거

-- 1단계: 같은 카테고리 내 중복 단어 확인
SELECT 
    c.name as category_name,
    w.english,
    COUNT(*) as duplicate_count,
    STRING_AGG(w.id::text, ', ' ORDER BY w.id) as word_ids
FROM words w
JOIN word_categories wc ON w.id = wc.word_id
JOIN categories c ON wc.category_id = c.id
GROUP BY c.name, w.english
HAVING COUNT(*) > 1
ORDER BY c.name, duplicate_count DESC;

-- 2단계: 같은 카테고리 내 중복 단어_카테고리 연결 제거 (가장 낮은 ID 제외)
WITH duplicates_to_remove AS (
    SELECT 
        wc.id as word_category_id,
        ROW_NUMBER() OVER (
            PARTITION BY c.id, w.english 
            ORDER BY w.id ASC
        ) as rn
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
)
DELETE FROM word_categories 
WHERE id IN (
    SELECT word_category_id 
    FROM duplicates_to_remove 
    WHERE rn > 1
);

-- 3단계: 더 이상 카테고리에 연결되지 않은 단어들 제거
DELETE FROM words 
WHERE id NOT IN (
    SELECT DISTINCT word_id 
    FROM word_categories
);

-- 4단계: 정리 후 확인
SELECT 
    c.name as category_name,
    w.english,
    COUNT(*) as count
FROM words w
JOIN word_categories wc ON w.id = wc.word_id
JOIN categories c ON wc.category_id = c.id
GROUP BY c.name, w.english
HAVING COUNT(*) > 1
ORDER BY c.name, count DESC;