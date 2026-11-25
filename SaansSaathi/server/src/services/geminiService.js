
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY is missing from environment variables.'
  );
}

const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3.8-flash';

const SYSTEM_INSTRUCTION = `
You are SaansSaathi AI, a hybrid conversational assistant.

Your capabilities:
- Answer general questions across a wide range of topics.
- Provide detailed explanations and helpful reasoning.
- Understand conversational context and follow-up questions.
- Provide additional expertise in air quality, pollution,
  environmental science, sustainability and cleaner living.

Guidelines:
- Generate natural, relevant and non-repetitive responses.
- Adapt explanations to the user's knowledge level.
- Never invent live environmental readings or current events.
- Clearly communicate uncertainty when information is unavailable.
- For medical questions, provide general information, not diagnoses.
- Never claim that you have accessed live data unless it is provided.
- Be friendly, clear and respectful.
`;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isRetryableError = (error) => {
  const status = error.status || error.code;

  return (
    status === 408 ||
    status === 429 ||
    status >= 500
  );
};

export const generateAssistantResponse = async (message) => {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: message,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      if (!response.text) {
        throw new Error('Gemini returned an empty response.');
      }

      return response.text;

    } catch (error) {
      const shouldRetry =
        isRetryableError(error) &&
        attempt < maxRetries;

      if (!shouldRetry) {
        throw error;
      }

      const baseDelay = 1000 * (2 ** attempt);
      const jitter = Math.floor(Math.random() * 500);
      const delay = baseDelay + jitter;

      console.warn(
        `Gemini temporary error. Retry ${attempt + 1}/${maxRetries} in ${delay}ms.`
      );

      await sleep(delay);
    }
  }

  throw new Error('Gemini request failed after retries.');
};
