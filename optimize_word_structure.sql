-- 방법: 가장 긴 한글 뜻을 가진 단어만 남기고, 카테고리별 컬럼 추가

-- 1단계: 새로운 카테고리 컬럼들 추가
ALTER TABLE words 
ADD COLUMN is_toeic BOOLEAN DEFAULT FALSE,
ADD COLUMN is_toefl BOOLEAN DEFAULT FALSE,
ADD COLUMN is_gtelp BOOLEAN DEFAULT FALSE,
ADD COLUMN is_suneung BOOLEAN DEFAULT FALSE,
ADD COLUMN is_gongmuwon BOOLEAN DEFAULT FALSE;

-- 2단계: 현재 데이터를 기반으로 카테고리 컬럼 업데이트
UPDATE words SET is_toeic = TRUE 
WHERE id IN (
    SELECT DISTINCT w.id 
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'toeic'
);

UPDATE words SET is_toefl = TRUE 
WHERE id IN (
    SELECT DISTINCT w.id 
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'toefl'
);

UPDATE words SET is_gtelp = TRUE 
WHERE id IN (
    SELECT DISTINCT w.id 
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'gtelp'
);

UPDATE words SET is_suneung = TRUE 
WHERE id IN (
    SELECT DISTINCT w.id 
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'suneung'
);

UPDATE words SET is_gongmuwon = TRUE 
WHERE id IN (
    SELECT DISTINCT w.id 
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN categories c ON wc.category_id = c.id
    WHERE c.name = 'gongmuwon'
);

-- 3단계: 같은 영단어 중에서 가장 긴 한글 뜻을 가진 것만 남기기
WITH ranked_words AS (
    SELECT 
        id,
        english,
        korean,
        LENGTH(korean) as korean_length,
        is_toeic,
        is_toefl,
        is_gtelp,
        is_suneung,
        is_gongmuwon,
        ROW_NUMBER() OVER (
            PARTITION BY english 
            ORDER BY LENGTH(korean) DESC, id ASC
        ) as rn
    FROM words
),
words_to_merge AS (
    SELECT 
        english,
        -- 가장 긴 뜻을 가진 단어의 정보
        FIRST_VALUE(id) OVER (PARTITION BY english ORDER BY LENGTH(korean) DESC, id ASC) as keep_id,
        -- 모든 카테고리 정보를 통합
        BOOL_OR(is_toeic) as merged_toeic,
        BOOL_OR(is_toefl) as merged_toefl,
        BOOL_OR(is_gtelp) as merged_gtelp,
        BOOL_OR(is_suneung) as merged_suneung,
        BOOL_OR(is_gongmuwon) as merged_gongmuwon
    FROM ranked_words
    GROUP BY english
)
-- 먼저 남길 단어들의 카테고리 정보 업데이트
UPDATE words 
SET 
    is_toeic = wtm.merged_toeic,
    is_toefl = wtm.merged_toefl,
    is_gtelp = wtm.merged_gtelp,
    is_suneung = wtm.merged_suneung,
    is_gongmuwon = wtm.merged_gongmuwon
FROM words_to_merge wtm
WHERE words.id = wtm.keep_id;

-- 4단계: 중복 단어들 제거 (가장 긴 뜻을 가진 것 제외)
WITH words_to_delete AS (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY english 
                ORDER BY LENGTH(korean) DESC, id ASC
            ) as rn
        FROM words
    ) ranked
    WHERE rn > 1
)
DELETE FROM words 
WHERE id IN (SELECT id FROM words_to_delete);

-- 5단계: 이제 word_categories 테이블은 불필요하므로 제거 가능
-- DROP TABLE word_categories;
-- DROP TABLE categories;