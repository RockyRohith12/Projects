
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing from environment variables.');
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 30000,
  },
});

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

export const generateAssistantResponse = async (message) => {
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
};
