import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, SearchResultItem } from "../types";

// Note: process.env.API_KEY is polyfilled by Vite. See vite.config.ts.
if (!process.env.API_KEY) {
  throw new Error("Google API Key is missing. Please set VITE_API_KEY in your .env file.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  /**
   * Searches for websites related to a topic using the Gemini API.
   */
  async searchWebsites(topic: string): Promise<SearchResultItem[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a helpful research assistant. Find 6-8 high-quality, distinct websites related to the user's topic: "${topic}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              websites: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    url: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "url", "description"]
                }
              }
            },
            required: ["websites"]
          },
          temperature: 0.7
        }
      });

      const jsonStr = response.text.trim();
      const parsed = JSON.parse(jsonStr);
      return parsed.websites || [];

    } catch (error) {
      console.error("Gemini Search Error:", error);
      throw new Error("Failed to find sources. The AI may be unavailable or the topic too restrictive.");
    }
  },

  /**
   * Generates a chat response based on the provided website context and message history using Gemini.
   */
  async getChatResponse(context: string, messages: ChatMessage[]): Promise<string> {
    const truncatedContext = context.slice(0, 100000); 

    const systemInstruction = `You are a specialized website assistant. Your goal is to answer questions and discuss topics based *only* on the provided study materials. Do not use any external knowledge. If the answer is not in the materials, say "I can't find that information in the provided text." Be friendly and concise.

Here are the study materials:
---
${truncatedContext}
---
`;

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
    
    // The last message in the history is the current user prompt.
    const contents = history;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        }
      });
      
      const resultText = response.text;
      
      if (!resultText) {
        throw new Error("Received an empty response from the Gemini API.");
      }
      
      return resultText;

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Re-throw the original error to be handled by the UI component
      throw error;
    }
  }
};