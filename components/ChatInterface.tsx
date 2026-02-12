import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, RefreshCw, Link as LinkIcon, Loader2 } from 'lucide-react';
import { ChatMessage, WebsiteData } from '../types';
import MessageBubble from './MessageBubble';
import { aiService } from '../services/aiService';

interface ChatInterfaceProps {
  websiteData: WebsiteData;
  onReset: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ websiteData, onReset }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: 'init-1',
      role: 'model',
      content: `I've analyzed **${websiteData.title || websiteData.url}**. Ask me anything about its content!`,
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  }, [websiteData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || isProcessing) return;

    const userMsgText = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgText,
      timestamp: Date.now()
    };
    
    // Optimistic update
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsProcessing(true);

    try {
      // Pass full context and history to the stateless API
      const responseText = await aiService.getChatResponse(
        websiteData.content,
        newHistory
      );
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error trying to generate a response. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      // Keep focus on input for rapid chatting
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-white md:shadow-2xl md:my-4 md:rounded-2xl md:h-[calc(100vh-2rem)] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={onReset}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title="Analyze another site"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="font-semibold text-slate-900 truncate flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              {websiteData.title || 'Unknown Page'}
            </h2>
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <LinkIcon size={10} />
              <span className="truncate max-w-[200px] md:max-w-md">{websiteData.url}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="hidden md:flex items-center gap-2 text-xs font-medium text-brand-600 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
        >
          <RefreshCw size={12} />
          New Chat
        </button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">
           {messages.map(msg => (
             <MessageBubble key={msg.id} message={msg} />
           ))}
           {isProcessing && (
             <div className="flex justify-start mb-6">
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium ml-2">Thinking...</span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the website content..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-slate-400"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="absolute right-2 bottom-2 p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-md"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Powered by Cerebras Inference
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
