import { ScrapeResult, WebsiteData } from '../types';

// Use a public CORS proxy to bypass browser restrictions for the demo.
// In a production app, this should be your own backend.
const PROXY_URL = 'https://api.allorigins.win/get?url=';

export const scrapeWebsite = async (url: string): Promise<ScrapeResult> => {
  try {
    // Validate URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    const response = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('No content received from proxy');
    }

    const html = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove scripts, styles, and other non-content elements
    const scripts = doc.querySelectorAll('script, style, iframe, noscript, nav, footer, header, svg');
    scripts.forEach(script => script.remove());

    // Extract text content
    const title = doc.title || targetUrl;
    let content = doc.body.textContent || '';

    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    if (content.length < 50) {
       throw new Error('Could not extract meaningful text content. The site might be SPA-only or blocking scrapers.');
    }

    const websiteData: WebsiteData = {
      url: targetUrl,
      title,
      content,
      timestamp: Date.now(),
    };

    return { success: true, data: websiteData };

  } catch (error: any) {
    // console.error("Scraping error:", error); // Optional: keep logs clean
    return { 
      success: false, 
      error: error.message || 'Failed to scrape website. Please try a different URL or paste content manually.' 
    };
  }
};

export const checkScrapability = async (url: string): Promise<boolean> => {
  const result = await scrapeWebsite(url);
  return result.success;
};
