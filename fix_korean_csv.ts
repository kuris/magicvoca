import fs from 'fs';

// 한국어 텍스트 수정 함수
function fixKoreanText(text: string): string {
  const fixes: { [key: string]: string } = {
    // 기본 인사말 수정
    '안녕 하새요!': '안녕하세요!',
    '여부세요?': '여보세요?',
    '칼러스 은요?': '카를로스는요?',
    '배구파요!': '배고파요!',
    '줗아하다': '좋아하다',
    '저두요!': '저도요!',
    
    // 문법 요소 수정
    'ㅂ니다': '습니다',
    'ㅂ니까?': '습니까?',
    
    // 기타 오타 수정 (더 추가할 수 있음)
    '엄마': '엄마',
    '아버지': '아버지',
  };
  
  let fixedText = text;
  
  // 기본 수정사항 적용
  for (const [wrong, correct] of Object.entries(fixes)) {
    fixedText = fixedText.replace(new RegExp(wrong, 'g'), correct);
  }
  
  // 추가 패턴 수정
  // 1. 불완전한 자음/모음 조합 수정
  fixedText = fixedText.replace(/ㅂ니다/g, '습니다');
  fixedText = fixedText.replace(/ㅂ니까/g, '습니까');
  
  // 2. 불필요한 공백 제거
  fixedText = fixedText.replace(/\s+/g, ' ').trim();
  
  return fixedText;
}

async function fixKoreanCSV() {
  try {
    console.log('Reading koreanword.csv...');
    const fileContent = fs.readFileSync('koreanword.csv', 'utf-8');
    
    const lines = fileContent.split('\n');
    const header = lines[0]; // korean,english
    
    const fixedLines = [header]; // 헤더는 그대로 유지
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
        fixedLines.push(line); // 문제가 있는 라인은 그대로 유지
      }
    }
    
    // 수정된 내용을 새 파일로 저장
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync('koreanword_fixed.csv', fixedContent, 'utf-8');
    
    console.log(`✅ Fixed ${fixedCount} Korean text issues`);
    console.log(`📄 Saved as koreanword_fixed.csv`);
    console.log(`📊 Total lines: ${fixedLines.length - 1} (excluding header)`);
    
    // 몇 가지 샘플 확인
    console.log('\n📝 Sample fixed data:');
    for (let i = 1; i <= Math.min(10, fixedLines.length - 1); i++) {
      console.log(`${i}. ${fixedLines[i]}`);
    }
    
  } catch (error) {
    console.error('Error fixing Korean CSV:', error);
  }
}

// 실행
fixKoreanCSV();