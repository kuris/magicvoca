const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../hanja.csv');
const outputPath = path.join(__dirname, '../hanja_nobracket.csv');

const raw = fs.readFileSync(csvPath, 'utf-8');

// meaning 컬럼의 []와 " 제거
const cleaned = raw.replace(/\[|\]|"/g, '');

fs.writeFileSync(outputPath, cleaned, 'utf-8');
console.log('완료: hanja_nobracket.csv 생성됨');
