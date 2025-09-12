const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../hanja_nobracket.csv');
const outputPath = path.join(__dirname, '../hanja_final.csv');

const raw = fs.readFileSync(inputPath, 'utf-8');
const lines = raw.split(/\r?\n/);

const result = [];
result.push('main_sound,level,hanja,meaning'); // 헤더

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  // CSV 파싱: 앞 4개 컬럼만 추출
  const cols = line.split(',');
  const main_sound = cols[0];
  const level = cols[1];
  const hanja = cols[2];
  let meaning = cols[3] ? cols[3].replace(/^'/, '').replace(/'$/, '').trim() : '';
  // 의미에 콤마가 있으면 전체를 "로 감싸기
  if (meaning.includes(',')) {
    meaning = `"${meaning}"`;
  }
  result.push(`${main_sound},${level},${hanja},${meaning}`);
}

fs.writeFileSync(outputPath, result.join('\n'), 'utf-8');
console.log('완료: hanja_final.csv 생성됨');
