-- 방법 1: 카테고리별 번역/설명을 별도 테이블로 관리
-- 하나의 단어(avoid)가 여러 카테고리에서 다른 번역/설명을 가질 수 있도록

-- 1. 새로운 테이블 생성: 카테고리별 단어 상세 정보
CREATE TABLE IF NOT EXISTS word_category_details (
    word_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    korean_translation TEXT,
    pronunciation TEXT,
    part_of_speech TEXT,
    tip TEXT,
    difficulty_level INTEGER,
    PRIMARY KEY (word_id, category_id),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 2. words 테이블을 단순화 (공통 정보만)
-- 기존 words 테이블에서 korean, pronunciation, part_of_speech, tip 제거 예정
-- ALTER TABLE words DROP COLUMN korean;
-- ALTER TABLE words DROP COLUMN pronunciation;  
-- ALTER TABLE words DROP COLUMN part_of_speech;
-- ALTER TABLE words DROP COLUMN tip;

-- 3. 기존 데이터를 새 구조로 마이그레이션
INSERT INTO word_category_details (word_id, category_id, korean_translation, pronunciation, part_of_speech, tip)
SELECT 
    w.id,
    wc.category_id,
    w.korean,
    w.pronunciation,
    w.part_of_speech,
    w.tip
FROM words w
JOIN word_categories wc ON w.id = wc.word_id;

-- 4. 'avoid' 같은 중복 단어들을 하나로 통합
-- 예시: avoid의 경우
WITH avoid_words AS (
    SELECT 
        w.id,
        w.english,
        wc.category_id,
        wcd.korean_translation,
        ROW_NUMBER() OVER (ORDER BY w.id) as rn
    FROM words w
    JOIN word_categories wc ON w.id = wc.word_id
    JOIN word_category_details wcd ON w.id = wcd.word_id AND wc.category_id = wcd.category_id
    WHERE w.english = 'avoid'
),
keep_word AS (
    SELECT id FROM avoid_words WHERE rn = 1
)
-- 이후 중복 단어들을 하나로 통합하는 로직 필요