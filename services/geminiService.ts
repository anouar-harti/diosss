import { GoogleGenAI } from "@google/genai";

/**
 * Enhances a rough job description into a professional technical report.
 */
export const enhanceJobDescription = async (roughText: string): Promise<string> => {
  if (!roughText || roughText.trim().length === 0) return "";

  try {
    // Initialize Gemini Client lazily to ensure environment variables are loaded
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a professional HVAC technician assistant. 
        Reword the following rough notes into a clean, professional, and technical service report paragraph suitable for a client invoice.
        Focus on clarity, technical accuracy, and polite tone. 
        Do not add invented details, just expand on what is provided.
        
        Rough notes: "${roughText}"
      `,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster simple text tasks
        systemInstruction: "You are a helpful assistant for trade professionals.",
      }
    });

    return response.text || roughText;
  } catch (error) {
    console.error("Error enhancing description with Gemini:", error);
    // Fallback to original text if AI fails
    return roughText;
  }
};