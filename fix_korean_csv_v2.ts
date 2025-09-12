import fs from 'fs';

// 한국어 텍스트 수정 함수 (개선된 버전)
function fixKoreanText(text: string): string {
  let fixedText = text;
  
  // 1. 정확한 오타 수정
  const exactFixes: { [key: string]: string } = {
    '안녕 하새요!': '안녕하세요!',
    '여부세요?': '여보세요?',
    '칼러스 은요?': '카를로스는요?',
    '배구파요!': '배고파요!',
    '줗아하다': '좋아하다',
    '저두요!': '저도요!',
    'ㅂ니다': '습니다',
    'ㅂ니까?': '습니까?',
  };
  
  for (const [wrong, correct] of Object.entries(exactFixes)) {
    fixedText = fixedText.replace(wrong, correct);
  }
  
  // 2. 중복 물음표 제거
  fixedText = fixedText.replace(/\?\?+/g, '?');
  
  // 3. 불필요한 공백 정리
  fixedText = fixedText.replace(/\s+/g, ' ').trim();
  
  return fixedText;
}

async function fixKoreanCSVV2() {
  try {
    console.log('Reading koreanword.csv (v2 fix)...');
    const fileContent = fs.readFileSync('koreanword.csv', 'utf-8');
    
    const lines = fileContent.split('\n');
    const header = lines[0];
    
    const fixedLines = [header];
    let fixedCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const commaIndex = line.indexOf(',');
      if (commaIndex > 0) {
        const korean = line.substring(0, commaIndex).trim();
        const english = line.substring(commaIndex + 1).trim();
        
        const fixedKorean = fixKoreanText(korean);
        
        if (fixedKorean !== korean) {
          console.log(`Fixed: "${korean}" → "${fixedKorean}"`);
          fixedCount++;
        }
        
        fixedLines.push(`${fixedKorean},${english}`);
      } else {
        fixedLines.push(line);
      }
    }
    
    // 수정된 내용을 새 파일로 저장
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync('koreanword_clean.csv', fixedContent, 'utf-8');
    
    console.log(`✅ Fixed ${fixedCount} Korean text issues (v2)`);
    console.log(`📄 Saved as koreanword_clean.csv`);
    console.log(`📊 Total lines: ${fixedLines.length - 1} (excluding header)`);
    
    // 샘플 확인
    console.log('\n📝 Clean sample data:');
    for (let i = 1; i <= Math.min(15, fixedLines.length - 1); i++) {
      console.log(`${i}. ${fixedLines[i]}`);
    }
    
  } catch (error) {
    console.error('Error fixing Korean CSV v2:', error);
  }
}

// 실행
fixKoreanCSVV2();