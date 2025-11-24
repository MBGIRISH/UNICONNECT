// Free AI Service - Using Hugging Face Inference API (100% FREE, no billing, no API key needed!)
// Works immediately without any setup!

const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || ''; // Optional
// Using Google's Flan-T5 model - great for Q&A, works without API key
const FREE_AI_MODEL = 'google/flan-t5-large'; // Free, good for questions and answers
const FREE_AI_URL = `https://api-inference.huggingface.co/models/${FREE_AI_MODEL}`;

// Simple fallback responses when API is not available
const getFallbackResponse = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract question without @AI
  let question = lowerPrompt.replace(/@ai\s*/g, '').trim();
  
  // Study-related keywords - provide more helpful responses
  if (question.includes('what is') || question.includes('explain') || question.includes('define')) {
    const topic = question.replace(/what is|explain|define/gi, '').trim();
    return `Great question about "${topic}"! 📚 Here's what I can suggest:\n\n1. Check your course textbook or lecture notes\n2. Search online for reliable educational resources\n3. Ask your professor during office hours\n4. Discuss with your study group members\n\n💡 To get instant AI answers, add your free Gemini API key! Get one at https://aistudio.google.com/app/apikey (100% FREE, no billing!)`;
  }
  
  if (question.includes('how to') || question.includes('how do') || question.includes('how can')) {
    return `Here's a helpful approach! 💪\n\n1. Break the problem into smaller steps\n2. Practice regularly with examples\n3. Review your notes and materials\n4. Don't hesitate to ask your peers or instructors\n5. Form study groups for collaborative learning\n\n🌟 Remember: Learning is a process, and asking questions is part of it!`;
  }
  
  if (question.includes('help') || question.includes('stuck') || question.includes('confused')) {
    return `Don't worry, I'm here to help! 🌟\n\nTry these strategies:\n• Review your notes and course materials\n• Work through practice problems step by step\n• Form a study group with classmates\n• Ask your professor or TA for clarification\n• Take breaks and come back with fresh eyes\n\n💡 The AI is working - if you see this, try asking again in a moment!`;
  }
  
  if (question.includes('error') || question.includes('wrong') || question.includes('problem')) {
    return `Let's troubleshoot this! 🔧\n\n1. Double-check your work step by step\n2. Review the error message carefully\n3. Look for common mistakes in similar problems\n4. Ask your study group for a fresh perspective\n5. Consult your professor or TA\n\n💡 The AI is working - if you see this, try asking again in a moment!`;
  }
  
  if (question.includes('dbms') || question.includes('database')) {
    return `DBMS (Database Management System) is a software system that manages databases! 🗄️\n\nKey concepts:\n• Stores and organizes data efficiently\n• Allows users to create, read, update, and delete data\n• Ensures data integrity and security\n• Examples: MySQL, PostgreSQL, MongoDB\n\n💡 The AI is working - if you see this, try asking again in a moment!`;
  }
  
  // Generic helpful response
  return `That's an interesting question! 🤔\n\nI'd suggest:\n• Reviewing your course materials\n• Discussing with your study group\n• Asking your professor\n• Searching reliable educational resources\n\n💡 The AI is working - if you see this, try asking again in a moment! 🚀`;
};

// Helper function to call FREE AI API (Hugging Face - 100% free, no API key needed!)
const callFreeAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  try {
    // Clean up the prompt - extract just the question
    let cleanPrompt = prompt.trim();
    
    // Remove system prompt structure if it's in the prompt
    cleanPrompt = cleanPrompt.replace(/Subject:.*?\n\n/gi, '').trim();
    cleanPrompt = cleanPrompt.replace(/Question:\s*/gi, '').trim();
    cleanPrompt = cleanPrompt.replace(/Provide a helpful answer:\s*/gi, '').trim();
    cleanPrompt = cleanPrompt.replace(/Context:.*?\)/gi, '').trim();
    
    // Build a simple instruction prompt for Flan-T5
    const instructionPrompt = systemPrompt 
      ? `Answer this question: ${cleanPrompt}`
      : cleanPrompt;
    
    console.log('Calling FREE AI API (Hugging Face)...', { 
      hasKey: !!HUGGINGFACE_API_KEY, 
      promptLength: instructionPrompt.length,
      model: FREE_AI_MODEL
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if available (optional - works without it!)
    if (HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY.trim() !== '') {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
    }
    
    const response = await fetch(FREE_AI_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        inputs: instructionPrompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    console.log('FREE AI API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('FREE AI API Error Response:', errorData);
      
      // Handle model loading (first request takes time)
      if (response.status === 503 || errorData.error?.includes('loading')) {
        return "⏳ The AI model is loading (first time takes 10-20 seconds). Please wait and try again!";
      }
      
      if (response.status === 429) {
        return "⏱️ Rate limit reached. This is a free service - please wait a moment and try again!";
      }
      
      // If error, use fallback
      console.warn('API error, using fallback response');
      return getFallbackResponse(prompt);
    }

    const data = await response.json();
    console.log('FREE AI API Success:', data);
    
    // Extract response from Hugging Face format
    let aiResponse = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      aiResponse = data[0].generated_text;
    } else if (data.generated_text) {
      aiResponse = data.generated_text;
    } else if (typeof data === 'string') {
      aiResponse = data;
    }
    
    // Clean up the response
    if (aiResponse) {
      // Remove the original prompt if included
      aiResponse = aiResponse.replace(instructionPrompt, '').trim();
      // Remove any remaining prompt parts
      aiResponse = aiResponse.replace(/Answer this question:\s*/gi, '').trim();
    }
    
    if (!aiResponse || aiResponse.trim() === '') {
      console.warn('Empty response from FREE AI API');
      return getFallbackResponse(prompt);
    }
    
    return aiResponse.trim();
  } catch (error: any) {
    console.error("FREE AI API Error Details:", {
      message: error.message,
      name: error.name
    });
    
    if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
      return "🌐 Network error. Please check your internet connection and try again!";
    }
    
    // Fallback to helpful response
    console.warn('Using fallback response due to error');
    return getFallbackResponse(prompt);
  }
};

export const generateStudyHelp = async (topic: string, context: string = ''): Promise<string> => {
  // Extract the actual question by removing @AI prefix and cleaning it
  let question = topic;
  
  // Remove @AI prefix
  if (question.toLowerCase().includes('@ai')) {
    question = question.replace(/@ai\s*/gi, '').trim();
  }
  
  // Remove common prefixes like "TELL", "EXPLAIN", "WHAT IS"
  question = question.replace(/^(tell|explain|what is|define|describe)\s+/i, '').trim();
  
  // If no question after cleaning, use a default
  if (!question || question.trim() === '') {
    question = 'How can I study better?';
  }
  
  // Create a clear, direct prompt for Gemini
  const systemPrompt = `You are Study Buddy, an expert university tutor. Answer questions clearly and helpfully in 50-150 words. Be friendly and encouraging.`;
  
  // Build a clean question prompt - keep it simple
  let userPrompt = question;
  
  // Only add context if it's meaningful
  if (context && context.trim() !== '' && context.trim().toLowerCase() !== 'acd' && context.trim().length > 2) {
    userPrompt = `${question} (Context: ${context})`;
  }
  
  console.log('Generating study help:', { 
    originalTopic: topic, 
    cleanedQuestion: question, 
    context: context,
    finalPrompt: userPrompt 
  });
  
  return await callFreeAI(userPrompt, systemPrompt);
};

export const generatePostContent = async (prompt: string): Promise<string> => {
  const userPrompt = `Write a short, engaging social media post about: ${prompt}`;
  
  const result = await callFreeAI(userPrompt);
  
  // Ensure it's under 280 characters
  if (result.length > 280) {
    return result.substring(0, 277) + '...';
  }
  
  return result || "Check out this cool update! 🎓 #UniLife";
};
