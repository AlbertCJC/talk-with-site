import React, { useState } from 'react';
import { Search, Globe, Loader2, AlertCircle, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { aiService } from '../services/aiService';
import { checkScrapability } from '../services/scraperService';
import { SearchResultItem } from '../types';

interface UrlInputProps {
  onUrlSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'topic'>('url');
  
  // Direct URL state
  const [inputUrl, setInputUrl] = useState('');

  // Topic Search state
  const [topic, setTopic] = useState('');
  const [isSearchingTopic, setIsSearchingTopic] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) onUrlSubmit(inputUrl);
  };

  const handleTopicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSearchingTopic(true);
    setSearchError(null);
    setSearchResults(null);
    setLoadingStatus('Curating sources...');

    try {
      const rawResults = await aiService.searchWebsites(topic);
      if (rawResults.length === 0) {
        setSearchError("No relevant journals or sites found. Try a different topic.");
        setIsSearchingTopic(false);
        return;
      }

      setLoadingStatus('Verifying access...');
      
      const uniqueResults: SearchResultItem[] = [];
      const seenUrls = new Set<string>();

      for (const item of rawResults) {
        const normalized = item.url.trim().toLowerCase().replace(/\/$/, '');
        if (!seenUrls.has(normalized)) {
          seenUrls.add(normalized);
          uniqueResults.push(item);
        }
      }

      const verificationPromises = uniqueResults.map(async (item) => {
        const isAccessible = await checkScrapability(item.url);
        return isAccessible ? item : null;
      });

      const verifiedResults = (await Promise.all(verificationPromises))
        .filter((item): item is SearchResultItem => item !== null);

      if (verifiedResults.length === 0) {
        setSearchError("Found sources, but they are protected. Try a more general inquiry.");
      } else {
        setSearchResults(verifiedResults);
      }

    } catch (err: any) {
      setSearchError(err.message || "Search unavailable at the moment.");
    } finally {
      setIsSearchingTopic(false);
      setLoadingStatus('');
    }
  };

  const resetSearch = () => {
    setSearchResults(null);
    setSearchError(null);
    setTopic('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-up">
      <div className="text-center mb-12">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-wider uppercase">
          AI Knowledge Companion
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-medium text-slate-900 dark:text-white mb-6 tracking-tight">
          Site<span className="italic text-primary-600 dark:text-primary-400">Scout</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Transform any website into an intelligent conversation. <br className="hidden md:block"/>
          Curate, extract, and understand content instantly.
        </p>
      </div>

      <div className="bg-white/70 dark:bg-charcoal/70 backdrop-blur-xl rounded-[2rem] shadow-2xl dark:shadow-black/50 border border-white/20 dark:border-white/5 overflow-hidden transition-colors duration-300">
        
        {/* Toggle Switch */}
        <div className="flex p-2 gap-2 bg-slate-100/50 dark:bg-black/20 mx-6 mt-6 rounded-2xl">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'url'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Globe size={16} />
            <span>Direct URL</span>
          </button>
          <button
            onClick={() => setActiveTab('topic')}
            className={`flex-1 py-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'topic'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} />
            <span>Discover</span>
          </button>
        </div>

        <div className="p-6 md:p-10 min-h-[300px] flex flex-col justify-center">
          {activeTab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-8 max-w-2xl mx-auto w-full">
              <div className="relative group">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste a website link here..."
                  className="block w-full px-6 py-5 bg-white dark:bg-white/5 border-b-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-all text-xl md:text-2xl font-light text-center"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-lg animate-fade-up">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading || !inputUrl}
                  className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-full font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl hover:shadow-2xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>Reading...</span>
                    </>
                  ) : (
                    <>
                      <span>Begin Analysis</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 w-full">
              {!searchResults ? (
                <form onSubmit={handleTopicSearch} className="space-y-8 max-w-2xl mx-auto">
                   <div className="relative group">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What do you want to learn about?"
                      className="block w-full px-6 py-5 bg-white dark:bg-white/5 border-b-2 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-all text-xl md:text-2xl font-light text-center"
                      autoFocus
                    />
                    <p className="text-center text-slate-400 text-sm mt-3">Try "History of Bauhaus", "Vegan Ramen Recipes", or "Latest AI News"</p>
                  </div>

                  {searchError && (
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-lg animate-fade-up">
                      <AlertCircle size={18} />
                      <span className="text-sm font-medium">{searchError}</span>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isSearchingTopic || !topic}
                      className="group relative inline-flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-full font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-xl hover:shadow-2xl"
                    >
                      {isSearchingTopic ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5" />
                          <span>{loadingStatus}</span>
                        </>
                      ) : (
                        <>
                          <span>Find Sources</span>
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="animate-fade-up w-full">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h3 className="font-serif text-2xl text-slate-900 dark:text-white">Curated Selection</h3>
                    <button 
                      onClick={resetSearch}
                      className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors underline decoration-slate-300 underline-offset-4"
                    >
                      Clear Results
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((site, index) => (
                      <div 
                        key={index} 
                        className="group relative bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-500/30 p-5 rounded-2xl transition-all hover:shadow-lg dark:hover:shadow-primary-900/20 cursor-pointer flex flex-col justify-between h-full"
                        onClick={() => onUrlSubmit(site.url)}
                      >
                        <div>
                          <h4 className="font-serif text-lg text-slate-900 dark:text-gray-100 mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                            {site.title}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                            {site.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-white/5">
                           <span className="text-xs font-mono text-slate-400 truncate max-w-[70%] flex items-center gap-1">
                             {new URL(site.url).hostname}
                           </span>
                           <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-white/10 text-slate-900 dark:text-white group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 transition-colors">
                              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlInput;