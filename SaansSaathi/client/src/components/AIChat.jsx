
import { useState } from 'react';
import { Send, Bot, User, LoaderCircle, Leaf } from 'lucide-react';
import { sendChatMessage } from '../services/aiService';
import './AIChat.css';

function AIChat({ environmentalContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm SaansSaathi AI. Ask me anything about air quality, pollution, sustainable living, or even general topics. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (event) => {
    event.preventDefault();

    const userMessage = input.trim();

    if (!userMessage || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: userMessage },
    ]);

    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        userMessage,
        conversationId,
        environmentalContext
);

      setConversationId(response.conversationId);

      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: response.reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: error.message || 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-chat">
      <div className="ai-chat-header">
        <div className="ai-chat-avatar">
          <Leaf size={22} />
        </div>

        <div>
          <h2>SaansSaathi AI</h2>
          <p>Your personal environmental assistant</p>
        </div>

        <span className="ai-chat-status">Online</span>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-message ${message.role}`}
          >
            <div className="ai-message-avatar">
              {message.role === 'assistant' ? (
                <Bot size={18} />
              ) : (
                <User size={18} />
              )}
            </div>

            <div className="ai-message-content">
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-avatar">
              <Bot size={18} />
            </div>

            <div className="ai-message-content typing">
              <LoaderCircle size={17} className="ai-spinner" />
              SaansSaathi is thinking...
            </div>
          </div>
        )}
      </div>

      <form className="ai-chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask SaansSaathi anything..."
          maxLength={4000}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}

export default AIChat;
