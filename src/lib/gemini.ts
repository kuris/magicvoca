import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_VERTEX_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateMemoryTechnique(englishWord: string, koreanMeaning: string): Promise<string> {
  try {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const prompt = `
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
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI 연상고리 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}