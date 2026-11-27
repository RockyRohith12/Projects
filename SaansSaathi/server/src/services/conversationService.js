
import { randomUUID } from 'node:crypto';

const conversations = new Map();

const MAX_MESSAGES = 20;

export const getConversation = (conversationId) => {
  if (!conversationId) {
    const newId = randomUUID();

    conversations.set(newId, []);

    return {
      conversationId: newId,
      messages: [],
    };
  }

  const messages = conversations.get(conversationId);

  if (!messages) {
    return null;
  }

  return {
    conversationId,
    messages,
  };
};

export const saveMessage = (conversationId, role, content) => {
  const messages = conversations.get(conversationId);

  if (!messages) {
    throw new Error('Conversation not found.');
  }

  messages.push({ role, content });

  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
};
