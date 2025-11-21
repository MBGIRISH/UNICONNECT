import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || ''; 
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateStudyHelp = async (topic: string, context: string): Promise<string> => {
  if (!genAI || !apiKey) {
    return "💡 Demo Mode: To use AI features, add your Gemini API key to the .env file. Get one at https://aistudio.google.com/apikey";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an expert university tutor helping a student in a study group. 
    The context of the study group is: ${context}.
    The student asks: "${topic}".
    Provide a concise, helpful, and encouraging answer (under 100 words).`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "I couldn't generate an answer at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the study database right now. Please check your API key.";
  }
};

export const generatePostContent = async (prompt: string): Promise<string> => {
  if (!genAI || !apiKey) {
    return "✨ Demo Post: Add your API key to use AI-powered post generation!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `Write a short, engaging social media post for a university student app about: "${prompt}". 
    Keep it casual, include emojis, and keep it under 280 characters.`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || "Check out this cool update! 🎓 #UniLife";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Check out this cool update! 🎓 #UniLife";
  }
};
