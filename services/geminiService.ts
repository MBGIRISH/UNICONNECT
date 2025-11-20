import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateStudyHelp = async (topic: string, context: string): Promise<string> => {
  if (!apiKey) return "Simulated AI Response: API Key missing. Please configure process.env.API_KEY.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert university tutor helping a student in a study group. 
      The context of the study group is: ${context}.
      The student asks: "${topic}".
      Provide a concise, helpful, and encouraging answer (under 100 words).`,
    });
    return response.text || "I couldn't generate an answer at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the study database right now.";
  }
};

export const generatePostContent = async (prompt: string): Promise<string> => {
  if (!apiKey) return "Simulated AI Post: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, engaging social media post for a university student app about: "${prompt}". 
      Keep it casual, include emojis, and keep it under 280 characters.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Check out this cool update! 🎓 #UniLife";
  }
};
