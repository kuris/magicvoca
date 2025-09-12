-- 한자 테이블 생성
CREATE TABLE IF NOT EXISTS hanja_characters (
    id SERIAL PRIMARY KEY,
    hanja VARCHAR(10) NOT NULL,
    korean TEXT NOT NULL,
    pronunciation TEXT,
    main_sound VARCHAR(50),
    level VARCHAR(20) NOT NULL,
    radical VARCHAR(10),
    strokes INTEGER,
    total_strokes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hanja_level ON hanja_characters(level);
CREATE INDEX IF NOT EXISTS idx_hanja_main_sound ON hanja_characters(main_sound);
CREATE INDEX IF NOT EXISTS idx_hanja_strokes ON hanja_characters(strokes);

-- 레벨별 코멘트
COMMENT ON TABLE hanja_characters IS '한국어문회 급수별 한자 데이터';
COMMENT ON COLUMN hanja_characters.hanja IS '한자';
COMMENT ON COLUMN hanja_characters.korean IS '한국어 뜻';
COMMENT ON COLUMN hanja_characters.pronunciation IS '한자 읽기';
COMMENT ON COLUMN hanja_characters.main_sound IS '대표 독음';
COMMENT ON COLUMN hanja_characters.level IS '급수 (8급, 7급, 6급, 5급, 4급, 3급, 2급, 1급, 특급)';
COMMENT ON COLUMN hanja_characters.radical IS '부수';
COMMENT ON COLUMN hanja_characters.strokes IS '획수';
COMMENT ON COLUMN hanja_characters.total_strokes IS '총 획수';