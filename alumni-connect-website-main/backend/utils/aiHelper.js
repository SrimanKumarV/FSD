const axios = require('axios');

// 1. Call Groq
async function callGroq(messages, model = "llama-3.1-8b-instant", temperature = 0.7, jsonMode = false) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("Groq API Key not configured");

  const payload = {
    model,
    messages,
    temperature
  };
  if (jsonMode) payload.response_format = { type: "json_object" };

  const response = await axios.post(
    `https://api.groq.com/openai/v1/chat/completions`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content;
}

// 2. Call Gemini (Fallback)
async function callGemini(messages, systemInstruction, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("Gemini API Key not configured");

  const contents = [];
  messages.forEach(msg => {
    if (msg.role !== 'system') {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  });

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      role: "system",
      parts: [{ text: systemInstruction }]
    };
  }

  if (jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    payload,
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

// 3. Orchestrator
async function callAIWithFallback(messages, systemInstruction, jsonMode = false) {
  try {
    return await callGroq(messages, "mixtral-8x7b-32768", 0.7, jsonMode);
  } catch (error) {
    console.warn("Groq API failed or not configured, falling back to Gemini...", error.response?.data || error.message);
    try {
      return await callGemini(messages, systemInstruction, jsonMode);
    } catch (geminiError) {
      console.error("Gemini fallback also failed:", geminiError.response?.data || geminiError.message);
      throw new Error("Both Groq and Gemini APIs failed or are not configured.");
    }
  }
}

module.exports = {
  callGroq,
  callGemini,
  callAIWithFallback
};
