

import csv
import psycopg2

# DB 접속 정보
conn = psycopg2.connect(
    host="aws-1-ap-northeast-2.pooler.supabase.com",
    port=6543,
    dbname="postgres",
    user="postgres.ggtydikxkfozlhnihrwr",
    password="76017602Ab!"
)
cur = conn.cursor()

not_found_words = []
total = 0
inserted = 0

with open("word_category_map.csv", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for idx, row in enumerate(reader, 1):
        word = row["word"]
        category = row["category"]
        total += 1

        # 단어 id 조회 (english 컬럼 사용)
        cur.execute("SELECT id FROM words WHERE english = %s", (word,))
        word_result = cur.fetchone()
        if not word_result:
            not_found_words.append(word)
            if idx % 100 == 0:
                print(f"{idx}행 처리 중... (누적 미매칭 단어: {len(not_found_words)})")
            continue  # 단어가 없으면 건너뜀
        word_id = word_result[0]

        # 카테고리 id 조회
        cur.execute("SELECT id FROM categories WHERE name = %s", (category,))
        category_result = cur.fetchone()
        if not category_result:
            if idx % 100 == 0:
                print(f"{idx}행 처리 중... (카테고리 미매칭)")
            continue  # 카테고리가 없으면 건너뜀
        category_id = category_result[0]

        # 관계 삽입 (중복 방지)
        cur.execute(
            "INSERT INTO word_categories (word_id, category_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (word_id, category_id)
        )
        inserted += 1
        if idx % 100 == 0:
            print(f"{idx}행 처리 중... (누적 삽입: {inserted})")

conn.commit()
cur.close()
conn.close()

print(f"총 {total}행 중 {inserted}건 삽입 완료.")
if not_found_words:
    print(f"매칭되지 않은 단어 {len(not_found_words)}건: 예시 - {not_found_words[:10]}")
