import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Add CSS keyframes for the dots animation
const ThinkingDots = () => {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="flex items-center">
        <span className="text-pink-600 text-sm font-medium mr-2">AI Coach is thinking</span>
        <div className="flex gap-1">
          <div className="thinking-dot"></div>
          <div className="thinking-dot"></div>
          <div className="thinking-dot"></div>
        </div>
      </div>
    </div>
  );
};

// Format the AI response for better readability
const formatAIResponse = (text) => {
  // Add markdown formatting for lists
  text = text.replace(/^(-|\d+\.)\s/gm, '* ');
  
  // Add markdown formatting for sections
  text = text.replace(/^([A-Z][^:]+):/gm, '### $1:');
  
  // Format key metrics and numbers
  text = text.replace(/(\d+(\.\d+)?)\s*(kg|reps|cm|%)/g, '**$1** $3');
  
  // Highlight important terms
  text = text.replace(/(strength|grade|progress|improvement|training|technique)/gi, '**$1**');
  
  return text;
};

const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID;

export function AskAI({ assessments, latestAssessment }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);

    try {
      // Format the context data
      const context = {
        latestAssessment: latestAssessment?.fields || {},
        historicalData: assessments?.map(a => a.fields) || [],
        metrics: {
          grade: latestAssessment?.fields?.Grade || 'N/A',
          fingerStrength: latestAssessment?.fields?.['Finger Strength Weight'] || 'N/A',
          coreStrength: latestAssessment?.fields?.['Core Strength'] || 'N/A',
          legSpread: latestAssessment?.fields?.['LEG SPREAD'] || 'N/A',
          pullUps: latestAssessment?.fields?.['Pull Up Repetitions'] || 'N/A',
          pushUps: latestAssessment?.fields?.['Push Up Repetitions'] || 'N/A',
          toeToBar: latestAssessment?.fields?.['Toe To bar Repetitions'] || 'N/A'
        }
      };

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an expert climbing coach with deep knowledge of training and performance optimization. 
                       Your role is to analyze climbing metrics and provide specific, actionable advice.
                       
                       Current Metrics:
                       - Grade: ${context.metrics.grade}
                       - Finger Strength: ${context.metrics.fingerStrength}
                       - Core Strength: ${context.metrics.coreStrength}
                       - Leg Spread: ${context.metrics.legSpread}
                       - Pull Ups: ${context.metrics.pullUps}
                       - Push Ups: ${context.metrics.pushUps}
                       - Toe to Bar: ${context.metrics.toeToBar}
                       
                       Historical Data: ${JSON.stringify(context.historicalData)}
                       
                       Provide concise, practical advice focused on:
                       1. Performance analysis
                       2. Specific training recommendations
                       3. Areas for improvement
                       4. Progressive goals`
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.choices[0].message.content 
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-50 to-white rounded-lg shadow-lg">
      <h2 className="p-4 text-xl font-bold text-pink-900 border-b border-pink-100">
        AI Climbing Coach
      </h2>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <MessageSquare className="w-12 h-12 text-pink-300" />
            <div>
              <h3 className="text-lg font-semibold text-pink-900 mb-2">
                Welcome to AI Coach!
              </h3>
              <p className="text-pink-600 max-w-sm">
                Ask me anything about your climbing performance, training plans, or technique improvements.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "How can I improve my finger strength?",
                "What should I focus on next?",
                "Create a training plan for me",
                "Analyze my progress"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    handleSubmit({ preventDefault: () => {} });
                  }}
                  className="text-sm px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                  : 'bg-white shadow-md'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold text-pink-900">AI Coach</span>
                </div>
              )}
              <div className={`prose prose-pink max-w-none ${message.role === 'assistant' ? 'text-left dir-ltr' : ''}`}>
                <ReactMarkdown>{message.role === 'assistant' ? formatAIResponse(message.content) : message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form 
        onSubmit={handleSubmit} 
        className="flex gap-2 items-end border-t border-pink-100 pt-4"
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your climbing performance..."
            className="w-full rounded-lg border-2 border-pink-200 p-3 pr-12 focus:outline-none focus:border-pink-500 transition-colors duration-200"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader className="w-5 h-5 animate-spin text-pink-400" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-pink-500 text-white rounded-lg p-3 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center w-12 h-12"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
