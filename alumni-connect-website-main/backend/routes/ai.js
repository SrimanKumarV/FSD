const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

// @route   POST /api/ai/chat
// @desc    Chat with AI Career Mentor
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      // Fallback Mock Response if no API key is set
      setTimeout(() => {
        let mockResponse = "I'm your AI Career Mentor! It looks like my API key hasn't been configured yet, so I'm running in offline demo mode. However, I'd suggest focusing on building strong projects and practicing problem-solving. How can I help you with your career goals today?";
        
        if (message.toLowerCase().includes('resume')) {
          mockResponse = "For a strong resume, make sure to highlight your impact with metrics (e.g., 'improved performance by 20%'). Keep it to one page, use a clean template, and ensure your GitHub/LinkedIn links are visible.";
        } else if (message.toLowerCase().includes('interview') || message.toLowerCase().includes('prepare')) {
          mockResponse = "To prepare for interviews, practice on LeetCode or HackerRank. Focus on Data Structures like Arrays, Trees, and Graphs. Also, prepare stories using the STAR method (Situation, Task, Action, Result) for behavioral rounds.";
        }

        return res.json({ reply: mockResponse });
      }, 1500); // Simulate network delay
      return;
    }

    // Prepare history format for Groq API (OpenAI compatible)
    const formattedHistory = [];
    
    // Add system instruction first
    const systemInstruction = "You are a helpful and professional AI Career Mentor for college students and alumni. You provide guidance on programming languages, resume review, interview preparation, higher studies, and career roadmaps. Keep responses concise, encouraging, and formatted well.";
    formattedHistory.push({ role: 'system', content: systemInstruction });

    if (history && history.length > 0) {
      history.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'model' || msg.role === 'assistant') {
           formattedHistory.push({
             role: msg.role === 'model' ? 'assistant' : msg.role,
             content: msg.text || msg.content
           });
        }
      });
    }

    // Add current user message
    formattedHistory.push({
      role: 'user',
      content: message
    });

    const response = await axios.post(
      `https://api.groq.com/openai/v1/chat/completions`,
      {
        model: "llama-3.1-8b-instant", // Updated to the active Llama 3.1 8B model on Groq
        messages: formattedHistory,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    const apiError = error?.response?.data?.error?.message || error.message;
    console.error('AI Chat Error:', error?.response?.data || error.message);
    res.status(500).json({ message: `API Error: ${apiError}` });
  }
});

module.exports = router;
