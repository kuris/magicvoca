-- THAI와 KOREAN 카테고리를 위한 테이블 복구

-- 1. categories 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 2. word_categories 테이블 생성
CREATE TABLE IF NOT EXISTS word_categories (
    word_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (word_id, category_id),
    FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 3. THAI와 KOREAN 카테고리 추가
INSERT INTO categories (name) VALUES ('THAI'), ('KOREAN') 
ON CONFLICT (name) DO NOTHING;

-- 4. THAI와 KOREAN 단어들 확인 (words 테이블의 category 컬럼 활용)
SELECT DISTINCT category FROM words WHERE category IN ('THAI', 'KOREAN');