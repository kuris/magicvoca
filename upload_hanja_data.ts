import fs from 'fs';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

interface HanjaRecord {
  main_sound: string;
  level: string;
  hanja: string;
  meaning: string;
}

// 급수를 단순화하는 함수
function simplifyLevel(level: string): string {
  if (level === '8급') return '8급';
  if (level === '7급' || level === '7급Ⅱ') return '7급';
  if (level === '6급' || level === '6급Ⅱ') return '6급';
  if (level === '5급' || level === '5급Ⅱ') return '5급';
  if (level === '4급' || level === '4급Ⅱ') return '4급';
  if (level === '3급' || level === '3급Ⅱ') return '3급';
  if (level === '2급') return '2급';
  if (level === '1급') return '1급';
  if (level === '특급' || level === '특급Ⅱ') return '특급';
  return level;
}

// meaning 파싱 함수
function parseMeaning(meaningStr: string): { korean: string; reading: string } {
  try {
    const parsed = JSON.parse(meaningStr);

    // 여러 의미가 있을 경우 첫 번째만 사용
    if (Array.isArray(parsed) && parsed.length > 0) {
      let firstMeaning = parsed[0];

      // 3단계 중첩: [[['햇빛'], ['희']]]
      if (Array.isArray(firstMeaning) && firstMeaning.length === 2 &&
          Array.isArray(firstMeaning[0]) && Array.isArray(firstMeaning[1])) {
        const korean = firstMeaning[0].join(', ');
        const reading = firstMeaning[1].join(', ');
        return { korean, reading };
      }

      // 2단계 중첩: [['햇빛', '희']]
      if (Array.isArray(firstMeaning) && firstMeaning.length === 2 &&
          typeof firstMeaning[0] === 'string' && typeof firstMeaning[1] === 'string') {
        return { korean: firstMeaning[0], reading: firstMeaning[1] };
      }

      // 다중 의미: [[['웃을'], ['희']], [['깨물'], ['절']]]
      if (Array.isArray(firstMeaning) && Array.isArray(firstMeaning[0])) {
        // 첫 번째 의미 사용
        const firstPair = firstMeaning[0];
        if (Array.isArray(firstPair) && firstPair.length >= 2) {
          const korean = Array.isArray(firstPair[0]) ? firstPair[0].join(', ') : firstPair[0];
          const reading = Array.isArray(firstPair[1]) ? firstPair[1].join(', ') : firstPair[1];
          return { korean, reading };
        }
      }

      // 다른 패턴들 시도
      if (Array.isArray(firstMeaning) && firstMeaning.length >= 2) {
        const korean = Array.isArray(firstMeaning[0]) ? firstMeaning[0].join(', ') : firstMeaning[0];
        const reading = Array.isArray(firstMeaning[1]) ? firstMeaning[1].join(', ') : firstMeaning[1];
        return { korean, reading };
      }
    }
  } catch (e) {
    console.warn('Failed to parse meaning:', meaningStr);
  }
  return { korean: '', reading: '' };
}

async function uploadHanjaData() {
  console.log('Reading hanja_final.csv file...');

  const csvData = fs.readFileSync('hanja_final.csv', 'utf-8');
  const records: HanjaRecord[] = [];

  return new Promise((resolve, reject) => {
    parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }, async (err: any, data: HanjaRecord[]) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        console.log(`Parsed ${data.length} hanja records`);

          const processedRecords = data.map(record => {
            const simplifiedLevel = simplifyLevel(record.level);
            return {
              hanja: record.hanja,
              meaning: record.meaning,
              main_sound: record.main_sound,
              level: simplifiedLevel,
              korean: record.meaning // meaning 값을 korean 컬럼에 저장
            };
          });

          // 급수별로 그룹화하여 통계 출력
          const levelStats = processedRecords.reduce((acc: Record<string, number>, record) => {
            acc[record.level] = (acc[record.level] || 0) + 1;
            return acc;
          }, {});

          console.log('\n급수별 통계:');
          Object.entries(levelStats)
            .sort(([a], [b]) => {
              if (a === '특급') return 1;
              if (b === '특급') return -1;
              return parseInt(a.replace('급', '')) - parseInt(b.replace('급', ''));
            })
            .forEach(([level, count]) => {
              console.log(`${level}: ${count}개`);
            });

          // 배치로 업로드 (1000개씩)
          const batchSize = 1000;
          let totalUploaded = 0;
          for (let i = 0; i < processedRecords.length; i += batchSize) {
            const batch = processedRecords.slice(i, i + batchSize);
            console.log(`Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedRecords.length / batchSize)} (${batch.length} records)...`);
            const { data, error } = await supabase
              .from('hanja_characters')
              .insert(batch);
            if (error) {
              console.error('Error uploading batch:', error);
              reject(error);
              return;
            }
            totalUploaded += batch.length;
            console.log(`Successfully uploaded ${totalUploaded}/${processedRecords.length} records`);
          }
          console.log(`\n✅ Successfully uploaded all ${totalUploaded} hanja records!`);
          resolve(totalUploaded);
        } catch (e) {
          reject(e);
        }
      });
    });
}

uploadHanjaData()
  .then(() => {
    console.log('한자 데이터 업로드 완료!');
    process.exit(0);
  })
  .catch(error => {
    console.error('한자 데이터 업로드 실패:', error);
    process.exit(1);
  });