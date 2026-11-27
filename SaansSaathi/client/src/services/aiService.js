
const API_BASE_URL = '/api/ai';

export const sendChatMessage = async (
  message,
  conversationId = null,
  environmentalContext = null
) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      ...(conversationId && { conversationId }),
      ...(environmentalContext && { environmentalContext }),
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Unable to connect to SaansSaathi AI.'
    );
  }

  return result;
};
