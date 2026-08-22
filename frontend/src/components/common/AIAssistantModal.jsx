import React, { useState, useEffect } from 'react';
import { aiService } from '../../services';
import { Button } from './UIComponents';
import { useAuth } from '../../context/AuthContext';

export const AIAssistantModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.email?.split('@')[0] || 'there'}! I am your DAYFLOW AI Assistant. Ask me about your attendance, remaining leave quotas, latest salary slips, or company policies.`,
      actions: ['How many leaves do I have?', 'Show my attendance for today', 'What is my latest salary?']
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || loading) return;

    // Append user message
    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await aiService.queryAssistant(text);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer,
          actions: res.suggested_actions || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'I encountered an error accessing HR records. Please verify your connection or consult the administrator.',
          actions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
        <div className="relative transform overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl transition-all sm:my-8 w-full max-w-xl border border-slate-800 flex flex-col h-[580px] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center shadow-glow font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  DAYFLOW AI Assistant
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    {user?.role}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Context-aware natural HR queries & policy helper</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-xs'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs'
                  }`}
                >
                  <p>{m.text}</p>
                </div>

                {/* Suggested prompt chips */}
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        onClick={() => handleSend(act)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-brand-600/30 hover:border-brand-500 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-semibold transition"
                      >
                        ⚡ {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                <span>Thinking & querying records...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g., 'What is my salary?', 'Show leaves', 'Absenteeism rate')..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="submit" variant="primary" size="sm" isLoading={loading} icon={Send}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
