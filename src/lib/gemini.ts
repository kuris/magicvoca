const API_KEY = import.meta.env.VITE_VERTEX_API_KEY;

const DAILY_LIMIT = 10;
const STORAGE_KEY = 'gemini_api_usage';

interface UsageData {
  date: string;
  count: number;
}

function checkAndIncrementUsage() {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STORAGE_KEY);
  let usage: UsageData = { date: today, count: 0 };

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      usage = parsed;
    }
  }

  if (usage.count >= DAILY_LIMIT) {
    throw new Error(`하루 AI 연상고리 생성 횟수(${DAILY_LIMIT}회)를 초과했습니다. 내일 다시 이용해주세요.`);
  }

  usage.count += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export async function generateMemoryTechnique(englishWord: string, koreanMeaning: string): Promise<string> {
  // 1. Check usage limit
  try {
    checkAndIncrementUsage();
  } catch (error) {
    throw error;
  }

  const prompt = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
영어 단어 "${englishWord}"(뜻: ${koreanMeaning})에 대한 창의적이고 재미있는 연상고리나 기억법을 1-2문장으로 만들어주세요.

다음과 같은 방식을 활용해주세요:
1. 발음과 비슷한 한국어 단어 연결
2. 단어의 철자나 모양을 활용한 시각적 연상
3. 재미있는 상황이나 스토리 연결
4. 어원이나 단어 구성 요소 활용

예시:
- "serendipity" → "세렌디피티, 세렌(고요한) + 디피(깊이) = 고요한 깊이에서 찾은 뜻밖의 행운!"
- "ephemeral" → "에페메랄, 에페(애페) + 메랄 = 애페하게 메랄메랄 사라지는 일시적인 것"

한국어로 답변하고, 이모지를 1-2개 포함해서 친근하게 작성해주세요.
답변에 볼드체(**)가 너무 많으면 가독성이 떨어지니, 핵심 단어 1-2개에만 제한적으로 사용해주세요.
`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(
      `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error Details:', errorData);
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // The response from streamGenerateContent is an array of objects
    // We need to combine the parts from the candidates
    let combinedText = '';
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.candidates && item.candidates[0]?.content?.parts?.[0]?.text) {
          combinedText += item.candidates[0].content.parts[0].text;
        }
      }
    } else {
      // Fallback for non-streamed response structure if it varies slightly
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        combinedText = data.candidates[0].content.parts[0].text;
      }
    }

    return combinedText.trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Re-throw user-facing errors (like limit exceeded) directly
    if (error instanceof Error && error.message.includes('초과했습니다')) {
      throw error;
    }
    throw new Error('AI 연상고리 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}