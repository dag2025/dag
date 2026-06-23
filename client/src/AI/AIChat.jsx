import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Boat from '../assets/AI.svg';
import '../styles/Chat.css';
import API_BASE_URL from '../Config/Api';

function AIChat() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Welcome message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: '👋 Hi! I\'m DAG Assistant – your fashion expert for ladies’ dresses and artificial jewellery. Ask me anything about products, sizes, colors, returns, or styling!',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await axios.post(`${API_BASE_URL}/ai/chat`, {
        message: input,
        conversationHistory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(res.data.message || 'Unknown error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      let errorMsg = '😓 Sorry, I encountered an error. Please try again.';
      if (err.response?.status === 401) errorMsg = '🔧 AI service not properly configured. Please contact support.';
      else if (err.response?.status === 503) errorMsg = '⏳ AI service is starting up. Please wait a moment.';
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        isError: true,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '🧹 Chat cleared! How can I assist you with your fashion needs today?',
      timestamp: new Date()
    }]);
  };

  const closeOffcanvas = () => {
    const offcanvas = document.querySelector('.ai-chat-offcanvas');
    if (offcanvas) offcanvas.classList.remove('show');
  };

  return (
    <div className="ai-chat-widget">
      {/* Floating Trigger Button */}
      <div 
        className="chat-trigger"
        data-bs-toggle="offcanvas"
        data-bs-target="#aiChatOffcanvas"
        aria-controls="aiChatOffcanvas"
      >
        <img src={Boat} alt="AI Assistant" />
      </div>

      {/* Offcanvas */}
      <div 
        className="ai-chat-offcanvas offcanvas" 
        id="aiChatOffcanvas" 
        tabIndex="-1"
        aria-labelledby="aiChatOffcanvasLabel"
      >
        <div className="offcanvas-header d-flex justify-content-between">
          <h5 className="offcanvas-title" id="aiChatOffcanvasLabel">
            DAG AI Assistant
          </h5>
          <i
            type="button" 
            className="bi bi-x-lg text-white" 
            data-bs-dismiss="offcanvas" 
            aria-label="Close"
            onClick={closeOffcanvas}
          ></i>
        </div>
        <div className="offcanvas-body">
          <div className="chat-container">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <i className="bi bi-chat-dots-fill"></i>
                <div>
                  <h5>Style Assistant</h5>
                  <small>Powered by DAG AI</small>
                </div>
              </div>
              <button className="clear-chat-btn" onClick={clearChat}>
                <i className="bi bi-plus-circle text-dark"></i> New Chat
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                  <div>{msg.content}</div>
                  {msg.timestamp && (
                    <div className="timestamp">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="message assistant">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about dresses, jewellery, sizes, returns, discounts..."
                  disabled={loading}
                />
                <button 
                  className="send-btn" 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()}
                >
                  <i className="bi bi-send text-white"></i>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;