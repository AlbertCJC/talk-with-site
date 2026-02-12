import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
            isUser ? 'bg-brand-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        <div
          className={`relative px-5 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-sm'
              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
               <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          
          <span className={`text-[10px] absolute bottom-1 ${isUser ? 'right-3 text-brand-200' : 'left-3 text-slate-400'} opacity-70`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
