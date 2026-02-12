import React from 'react';
import { User, BookOpen } from 'lucide-react';
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
      } animate-fade-up group`}
    >
      <div
        className={`flex max-w-[90%] md:max-w-[80%] gap-4 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-md mt-2 ${
            isUser 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
              : 'bg-gradient-to-tr from-primary-400 to-blue-400 text-white'
          }`}
        >
          {isUser ? <User size={14} /> : <BookOpen size={14} />}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-6 py-5 rounded-2xl shadow-sm text-base leading-relaxed border transition-colors duration-300 ${
            isUser
              ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-white/5 rounded-tr-none'
              : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-white/5 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap font-sans">{message.content}</p>
          ) : (
            <div className="markdown-content font-sans prose prose-sm dark:prose-invert max-w-none prose-p:leading-7 prose-headings:font-serif prose-headings:font-medium prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:font-semibold">
               <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          
          <span className={`text-[10px] absolute -bottom-5 ${isUser ? 'right-0' : 'left-0'} text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;