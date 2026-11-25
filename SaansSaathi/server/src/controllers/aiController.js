
import { generateAssistantResponse } from '../services/geminiService.js';

export const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    // Validate user input
    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.length > 4000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message (maximum 4000 characters).',
      });
    }

    // Generate a dynamic Gemini response
    const reply = await generateAssistantResponse(message.trim());

    return res.status(200).json({
      success: true,
      reply,
    });

  } catch (error) {
    console.error('AI controller error:', error.message);

    return res.status(502).json({
      success: false,
      message: 'The AI assistant is temporarily unavailable. Please try again.',
    });
  }
};
