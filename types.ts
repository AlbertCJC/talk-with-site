export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface WebsiteData {
  url: string;
  title: string;
  content: string; // The raw text content
  timestamp: number;
}

export interface SearchResultItem {
  title: string;
  url: string;
  description: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SCRAPING = 'SCRAPING',
  CHATTING = 'CHATTING',
  ERROR = 'ERROR'
}

export interface ScrapeResult {
  success: boolean;
  data?: WebsiteData;
  error?: string;
}
