import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, SearchResultItem } from "../types";

// Initialize Gemini client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  /**
   * Searches for websites related to a topic using Gemini with Google Search grounding.
   */
  async searchWebsites(topic: string): Promise<SearchResultItem[]> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find 8 distinct, high-quality, and accessible websites related to the topic: "${topic}". 
        Return a JSON array where each object has "title", "url" (must be a valid full http URL), and "description" (brief summary).`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['title', 'url', 'description']
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        // Handle potential wrapper object if model outputs { websites: [...] } - though schema suggests array
        if ((parsed as any).websites && Array.isArray((parsed as any).websites)) return (parsed as any).websites;
        return [];
      } catch (e) {
        console.error("JSON Parse error", e);
        return [];
      }
    } catch (error: any) {
      console.error("Search error", error);
      throw new Error("Failed to search for websites. Please try again.");
    }
  },

  /**
   * Generates a chat response based on the provided website context and message history.
   */
  async getChatResponse(context: string, messages: ChatMessage[]): Promise<string> {
    const systemInstruction = `You are a specialized website assistant. Your goal is to answer questions and discuss topics based *only* on the provided study materials. Do not use any external knowledge. If the answer is not in the materials, say "I can't find that information in the study materials." Be friendly and encouraging.

Here are the study materials:
---
${context}
---
`;

    // The messages array passed here INCLUDES the latest user message (optimistic update).
    // We separate it to use in sendMessage.
    const historyMessages = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) return "";

    // Map to Gemini history format
    const history = historyMessages
        .map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }))
        // Filter out system messages if any (shouldn't be based on types, but safe to filter)
        .filter(msg => msg.role === 'user' || msg.role === 'model');

    // Gemini conversation history usually expects to start with a User message.
    // The ChatInterface initializes with a Model greeting. We should remove it from the API history
    // to prevent errors and potential confusion.
    if (history.length > 0 && history[0].role === 'model') {
        history.shift();
    }

    try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        },
        history: history
      });

      const result = await chat.sendMessage({
        message: lastMessage.content
      });

      return result.text || "I couldn't generate a response.";

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error("An error occurred while contacting the Gemini API.");
    }
  }
};