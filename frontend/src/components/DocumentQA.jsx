import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { FiMessageSquare, FiSend, FiGlobe, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { textToSpeech } from '../utils/textToSpeech';

export function DocumentQA() {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);

  const sessionId = useStore((state) => state.sessionId);
  const chatMessages = useStore((state) => state.chatMessages);
  const addChatMessage = useStore((state) => state.addChatMessage);

  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  useEffect(() => {
    return () => {
      textToSpeech.stop();
    };
  }, []);

  const handleSpeak = (text, id) => {
    if (isSpeaking && speakingId === id) {
      textToSpeech.stop();
      setIsSpeaking(false);
      setSpeakingId(null);
    } else {
      textToSpeech.speak(text);
      setIsSpeaking(true);
      setSpeakingId(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setError(null);
    setLoading(true);

    // Add user message
    addChatMessage({
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    });

    setQuestion('');

    try {
      const response = await api.askQuestion(sessionId, question, language);
      
      // Add AI response
      addChatMessage({
        role: 'assistant',
        content: response.data.answer || 'Unable to answer the question',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get answer');
      addChatMessage({
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || 'Failed to get answer'}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Ask About Your Document</h2>
          </div>
          <div className="flex items-center gap-2">
            <FiGlobe className="w-4 h-4 text-gray-600" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <FiMessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Ask questions about your document</p>
              <p className="text-sm mt-2">Questions are answered based on the document content</p>
            </div>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeak(msg.content, idx)}
                      className={`ml-2 p-1 rounded transition-colors flex-shrink-0 ${
                        isSpeaking && speakingId === idx
                          ? msg.role === 'user'
                            ? 'bg-blue-700'
                            : 'bg-gray-300'
                          : msg.role === 'user'
                          ? 'bg-blue-700 hover:bg-blue-800'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      title="Listen to answer"
                    >
                      {isSpeaking && speakingId === idx ? (
                        <FiVolumeX className="w-4 h-4" />
                      ) : (
                        <FiVolume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border-t border-gray-200 p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the document..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <FiSend className="w-4 h-4" />
            Send
          </button>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          💡 Answers are grounded strictly in your document content
        </p>
      </form>
    </div>
  );
}
