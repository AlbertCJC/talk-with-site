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
    if (inputUrl.trim()) {
      onUrlSubmit(inputUrl);
    }
  };

  const handleTopicSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSearchingTopic(true);
    setSearchError(null);
    setSearchResults(null);
    setLoadingStatus('Searching for websites...');

    try {
      // 1. Get raw candidates from AI
      const rawResults = await aiService.searchWebsites(topic);
      
      if (rawResults.length === 0) {
        setSearchError("No relevant websites found. Try a different topic.");
        setIsSearchingTopic(false);
        return;
      }

      setLoadingStatus('Verifying access to content...');

      // 2. Deduplicate URLs
      const uniqueResults: SearchResultItem[] = [];
      const seenUrls = new Set<string>();

      for (const item of rawResults) {
        // Simple normalization: lower case and remove trailing slash
        const normalized = item.url.trim().toLowerCase().replace(/\/$/, '');
        if (!seenUrls.has(normalized)) {
          seenUrls.add(normalized);
          uniqueResults.push(item);
        }
      }

      // 3. Verify Scrapability (in parallel)
      // We map the check to the item or null, then filter out nulls
      const verificationPromises = uniqueResults.map(async (item) => {
        const isAccessible = await checkScrapability(item.url);
        return isAccessible ? item : null;
      });

      const verifiedResults = (await Promise.all(verificationPromises))
        .filter((item): item is SearchResultItem => item !== null);

      if (verifiedResults.length === 0) {
        setSearchError("Found websites matching your topic, but was unable to automatically access their content (they may be protected or require login). Please try a more general topic.");
      } else {
        setSearchResults(verifiedResults);
      }

    } catch (err: any) {
      console.error(err);
      // Display the actual error message from the service (e.g. Auth failed)
      setSearchError(err.message || "Failed to search for websites. Please try again.");
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
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 mb-4 pb-1">
          SiteScout AI
        </h1>
        <p className="text-slate-500 text-lg">
          Chat with any website. Extract knowledge instantly.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'url'
                ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Globe size={18} />
            Direct URL
          </button>
          <button
            onClick={() => setActiveTab('topic')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'topic'
                ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={18} />
            Explore Topic
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Unable to process request</p>
                    <p className="mt-1 opacity-90">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !inputUrl}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-brand-500/40 active:transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Analyzing Content...</span>
                  </>
                ) : (
                  <span>Start Exploring</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {!searchResults ? (
                <form onSubmit={handleTopicSearch} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Sparkles className="h-5 w-5 text-brand-500" />
                    </div>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Best Italian recipes, Space exploration news"
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-lg"
                      autoFocus
                    />
                  </div>

                  {searchError && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 animate-in slide-in-from-top-2">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Search Failed</p>
                        <p className="mt-1 opacity-90">{searchError}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSearchingTopic || !topic}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-brand-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-brand-500/40 active:transform active:scale-[0.98]"
                  >
                    {isSearchingTopic ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>{loadingStatus}</span>
                      </>
                    ) : (
                      <span>Find Websites</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Results for "{topic}"</h3>
                    <button 
                      onClick={resetSearch}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Search Another Topic
                    </button>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 font-semibold text-slate-700">Website</th>
                            <th className="px-6 py-3 font-semibold text-slate-700">Description</th>
                            <th className="px-6 py-3 font-semibold text-slate-700 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {searchResults.map((site, index) => (
                            <tr key={index} className="hover:bg-brand-50/50 transition-colors group">
                              <td className="px-6 py-4 font-medium text-slate-900 w-1/4">
                                <div className="flex flex-col">
                                  <span>{site.title}</span>
                                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-brand-600 flex items-center gap-1 mt-1">
                                    {new URL(site.url).hostname} <ExternalLink size={10} />
                                  </a>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 w-1/2">
                                {site.description}
                              </td>
                              <td className="px-6 py-4 text-right w-1/4">
                                <button
                                  onClick={() => onUrlSubmit(site.url)}
                                  disabled={isLoading}
                                  className="inline-flex items-center gap-1 bg-white border border-brand-200 text-brand-700 hover:bg-brand-600 hover:text-white px-4 py-2 rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-md disabled:opacity-50"
                                >
                                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Select'} <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {error && (
                     <div className="mt-4 flex items-start gap-3 p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Selection Failed</p>
                          <p className="mt-1 opacity-90">{error}</p>
                        </div>
                      </div>
                  )}
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
