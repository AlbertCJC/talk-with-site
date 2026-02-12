import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage, SearchResultItem } from "../types";

// Ensure API key is available
const apiKey = process.env.API_KEY || '';
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export class GeminiChatService {
  private chatSession: Chat | null = null;
  private websiteContext: string = "";

  constructor() {}

  /**
   * Searches for websites related to a topic using Google Search grounding.
   */
  async searchWebsites(topic: string): Promise<SearchResultItem[]> {
    try {
      // Requested 8 items to ensure we have enough valid ones after filtering for scrapability
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find 8 distinct, high-quality, and accessible websites related to the topic: "${topic}". 
        Return a JSON array where each object has "title", "url" (must be a valid full http URL), and "description" (brief summary).
        Ensure the URLs are direct links to content, not just search result pages.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) return [];
      
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  /**
   * Initializes the chat session with the scraped website context.
   */
  async initializeChat(context: string): Promise<void> {
    this.websiteContext = context;
    
    // We configure the system instruction to strictly limit knowledge.
    const systemInstruction = `
You are a specialized website assistant. 
You have access to the text content of a specific webpage. 
Your goal is to answer user questions based STRICTLY and ONLY on the provided context.
Do not use your own outside knowledge, general facts, or information from the internet unless it is explicitly present in the provided context.
If the answer to a user's question is not found in the context, you must politely state that the information is not available on the website.
Do not hallucinate URLs or facts.
    `;

    try {
      this.chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, // Lower temperature for more factual responses
        },
        history: [
            {
                role: 'user',
                parts: [{ text: `Here is the website content you must use as your source of truth:\n\n=== BEGIN CONTENT ===\n${this.websiteContext}\n=== END CONTENT ===\n\nPlease confirm you understand the instructions.` }]
            },
            {
                role: 'model',
                parts: [{ text: "I understand. I will answer questions solely based on the provided website content." }]
            }
        ]
      });
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      throw error;
    }
  }

  /**
   * Sends a message to the Gemini model and returns the response text.
   */
  async sendMessage(userMessage: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error("Chat session not initialized. Call initializeChat first.");
    }

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: userMessage
      });

      return response.text || "I couldn't generate a response.";
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}

// Singleton instance
export const geminiService = new GeminiChatService();
