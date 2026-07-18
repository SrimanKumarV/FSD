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

    const apiKey = process.env.GEMINI_API_KEY;

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

    // Prepare history format for Gemini API
    const formattedHistory = [];
    if (history && history.length > 0) {
      history.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'model') {
           formattedHistory.push({
             role: msg.role,
             parts: [{ text: msg.text }]
           });
        }
      });
    }

    // Add current message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = "You are a helpful and professional AI Career Mentor for college students and alumni. You provide guidance on programming languages, resume review, interview preparation, higher studies, and career roadmaps. Keep responses concise, encouraging, and formatted well.";

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: formattedHistory,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;
    res.json({ reply });

  } catch (error) {
    const apiError = error?.response?.data?.error?.message || error.message;
    console.error('AI Chat Error:', error?.response?.data || error.message);
    res.status(500).json({ message: `API Error: ${apiError}` });
  }
});

module.exports = router;
