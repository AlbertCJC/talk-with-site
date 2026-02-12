import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import ChatInterface from './components/ChatInterface';
import { AppState, WebsiteData } from './types';
import { scrapeWebsite } from './services/scraperService';
// Removed geminiService import as we now use stateless aiService in components

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const handleUrlSubmit = async (url: string) => {
    setAppState(AppState.SCRAPING);
    setErrorMessage(undefined);

    const result = await scrapeWebsite(url);

    if (result.success && result.data) {
      // No initialization needed for stateless AI service
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      {(appState === AppState.IDLE || appState === AppState.SCRAPING || appState === AppState.ERROR) && (
        <UrlInput 
          onUrlSubmit={handleUrlSubmit} 
          isLoading={appState === AppState.SCRAPING}
          error={appState === AppState.ERROR ? errorMessage : undefined}
        />
      )}

      {appState === AppState.CHATTING && websiteData && (
        <div className="w-full h-full animate-in fade-in duration-500">
           <ChatInterface websiteData={websiteData} onReset={handleReset} />
        </div>
      )}
    </div>
  );
};

export default App;
