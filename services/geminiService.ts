// Grok AI Service (Free API with $25/month credits)
// Get your free API key at: https://console.x.ai/

const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// Simple fallback responses when API is not available
const getFallbackResponse = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Study-related keywords
  if (lowerPrompt.includes('what is') || lowerPrompt.includes('explain')) {
    return "That's a great question! I'd recommend checking your course materials or asking your professor for clarification. You can also discuss this with your study group members! 📚";
  }
  if (lowerPrompt.includes('how to') || lowerPrompt.includes('how do')) {
    return "Here's a helpful approach: Break it down into smaller steps, practice regularly, and don't hesitate to ask for help from your peers or instructors! 💪";
  }
  if (lowerPrompt.includes('help') || lowerPrompt.includes('stuck')) {
    return "Don't worry! Try reviewing your notes, working through examples, or forming a study group. Remember, asking questions is part of learning! 🌟";
  }
  
  return "That's an interesting question! For the best AI-powered help, add your free Grok API key. Get one at https://console.x.ai/ (Free $25/month!) 🚀";
};

// Helper function to call Grok API
const callGrokAPI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  if (!GROK_API_KEY) {
    // Return helpful fallback instead of just error message
    return getFallbackResponse(prompt);
  }

  try {
    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-4-latest', // Latest Grok model
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);
      throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I couldn't generate an answer at the moment.";
  } catch (error: any) {
    console.error("Grok API Error:", error);
    
    // Fallback to a helpful response if API fails
    if (error.message?.includes('API key')) {
      return "💡 Please add your Grok API key to the .env file. Get a free key at https://console.x.ai/";
    }
    
    return "Sorry, I'm having trouble connecting right now. Please try again in a moment!";
  }
};

export const generateStudyHelp = async (topic: string, context: string): Promise<string> => {
  const systemPrompt = `You are an expert university tutor helping students in a study group. Be concise, helpful, and encouraging. Keep answers under 100 words.`;
  const userPrompt = `Study Group Context: ${context}\n\nStudent Question: "${topic}"\n\nProvide a helpful answer:`;
  
  return await callGrokAPI(userPrompt, systemPrompt);
};

export const generatePostContent = async (prompt: string): Promise<string> => {
  const systemPrompt = `You are a social media content creator for a university student app. Write engaging, casual posts with emojis. Keep it under 280 characters.`;
  const userPrompt = `Write a short, engaging social media post about: "${prompt}"`;
  
  const result = await callGrokAPI(userPrompt, systemPrompt);
  
  // Ensure it's under 280 characters
  if (result.length > 280) {
    return result.substring(0, 277) + '...';
  }
  
  return result || "Check out this cool update! 🎓 #UniLife";
};
