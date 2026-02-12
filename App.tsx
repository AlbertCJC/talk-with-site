import React, { useState, useEffect } from 'react';
import UrlInput from './components/UrlInput';
import ChatInterface from './components/ChatInterface';
import { AppState, WebsiteData } from './types';
import { scrapeWebsite } from './services/scraperService';
import { Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      // Default to dark unless explicitly set to light
      return localStorage.getItem('theme') !== 'light';
    }
    return true; // Default for SSR or non-browser envs
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleUrlSubmit = async (url: string) => {
    setAppState(AppState.SCRAPING);
    setErrorMessage(undefined);

    const result = await scrapeWebsite(url);

    if (result.success && result.data) {
      setWebsiteData(result.data);
      setAppState(AppState.CHATTING);
    } else {
      setErrorMessage(result.error || "Failed to scrape the website.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setWebsiteData(null);
    setErrorMessage(undefined);
  };

  return (
    <div className="relative min-h-screen flex flex-col transition-colors duration-500">
      
      {/* Abstract Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-300/20 dark:bg-primary-900/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-300/20 dark:bg-blue-900/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation / Theme Toggle */}
      <nav className="absolute top-0 right-0 p-6 z-50">
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        {(appState === AppState.IDLE || appState === AppState.SCRAPING || appState === AppState.ERROR) && (
          <UrlInput 
            onUrlSubmit={handleUrlSubmit} 
            isLoading={appState === AppState.SCRAPING}
            error={appState === AppState.ERROR ? errorMessage : undefined}
          />
        )}

        {appState === AppState.CHATTING && websiteData && (
          <div className="w-full h-full animate-fade-up">
             <ChatInterface websiteData={websiteData} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;