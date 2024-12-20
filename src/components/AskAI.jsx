import React, { useState } from 'react';
import { Send, Loader, MessageCircle } from 'lucide-react';
import { generateAIResponse } from '../utils/openai';

const conversationStarters = [
  {
    text: "What should I train today?",
    category: "Training"
  },
  {
    text: "How can I improve my finger strength?",
    category: "Strength"
  },
  {
    text: "What grade can I climb?",
    category: "Performance"
  },
  {
    text: "How can I prevent injuries?",
    category: "Health"
  },
  {
    text: "What are my weaknesses?",
    category: "Analysis"
  },
  {
    text: "How's my progress?",
    category: "Progress"
  }
];

const AskAI = ({ assessments }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Get AI response using OpenAI
      const response = await generateAIResponse(userMessage, assessments);
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterClick = (starter) => {
    setMessage(starter.text);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
        <MessageCircle className="text-indigo-600" />
        Ask AI Coach
      </h2>
      
      {/* Conversation Starters */}
      {chatHistory.length === 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Try asking about:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {conversationStarters.map((starter, index) => (
              <button
                key={index}
                onClick={() => handleStarterClick(starter)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors bg-white"
              >
                <span className="text-xs font-medium text-indigo-600">{starter.category}</span>
                <p className="text-sm text-gray-700">{starter.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Chat History */}
      <div className="mb-4 h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {chatHistory.length === 0 ? (
          <div className="text-gray-600 text-center py-4">
            Select a question above or ask your own!
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white ml-8'
                    : 'bg-white border border-gray-200 text-gray-700 mr-8'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-3 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-gray-700"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
        >
          {isLoading ? <Loader className="animate-spin" /> : <Send />}
        </button>
      </form>
    </div>
  );
};

export default AskAI;
