import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, RefreshCw, Link as LinkIcon, Loader2, BookOpen } from 'lucide-react';
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
      content: `I have read **${websiteData.title || "the page"}**. \n\nWhat would you like to know?`,
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
    
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsProcessing(true);

    try {
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
        content: "I encountered a disturbance in the data stream. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-[85vh] max-w-6xl mx-auto bg-white/80 dark:bg-charcoal/80 backdrop-blur-xl md:rounded-[2rem] shadow-2xl dark:shadow-black/60 border border-white/20 dark:border-white/5 overflow-hidden transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 p-4 md:p-6 flex items-center justify-between shrink-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onReset}
            className="group p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            title="Back to search"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="flex flex-col min-w-0">
            <h2 className="font-serif text-xl text-slate-900 dark:text-white truncate flex items-center gap-2">
              {websiteData.title || 'Untitled Page'}
            </h2>
            <a 
              href={websiteData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
            >
              <LinkIcon size={10} />
              <span className="truncate">{new URL(websiteData.url).hostname}</span>
            </a>
          </div>
        </div>

        <button 
          onClick={onReset}
          className="hidden md:flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <RefreshCw size={12} />
          New Session
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide bg-slate-50/50 dark:bg-black/20">
          <div className="max-w-3xl mx-auto space-y-8">
             {messages.map(msg => (
               <MessageBubble key={msg.id} message={msg} />
             ))}
             
             {isProcessing && (
               <div className="flex justify-start animate-fade-up">
                  <div className="flex items-center gap-3 pl-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-blue-400 flex items-center justify-center shadow-lg shadow-primary-500/20">
                      <BookOpen size={14} className="text-white" />
                    </div>
                    <div className="flex space-x-1.5 bg-white dark:bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-charcoal border-t border-slate-100 dark:border-white/5 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 group">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-primary-500/50 dark:focus:border-primary-400/50 focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-400/10 transition-all placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="absolute right-2 p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed shadow-md"
            >
              {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <div className="mt-3 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 tracking-widest font-medium uppercase opacity-60">
              Powered by Google Gemini
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;