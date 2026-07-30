const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/auth');
const { callAIWithFallback } = require('../utils/aiHelper');

const upload = multer({ storage: multer.memoryStorage() });
// @route   POST /api/ai/chat
// @desc    Chat with AI Career Mentor
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Mock mode if no keys
    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      setTimeout(() => {
        let mockResponse = "I'm your AI Career Mentor! It looks like my API keys haven't been configured yet, so I'm running in offline demo mode. How can I help you with your career goals today?";
        if (message.toLowerCase().includes('resume')) {
          mockResponse = "For a strong resume, highlight impact with metrics.";
        }
        return res.json({ reply: mockResponse });
      }, 1500);
      return;
    }

    const formattedHistory = [];
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

    formattedHistory.push({ role: 'user', content: message });

    const reply = await callAIWithFallback(formattedHistory, systemInstruction, false);
    res.json({ reply });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: `API Error: ${error.message}` });
  }
});

// @route   POST /api/ai/analyze-resume
// @desc    Analyze resume against Job Description
// @access  Private
router.post('/analyze-resume', protect, upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    
    if (!req.file || !jobDescription) {
      return res.status(400).json({ message: 'Resume (PDF) and Job Description are required' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are supported' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        atsScore: 85,
        stars: 4.5,
        grammarScore: 90,
        impactScore: 80,
        rating: "Strong Match (Mock)",
        missingSkills: ["Mock Skill 1", "Mock Skill 2"],
        suggestions: ["Add real API key for real analysis."]
      });
    }

    const systemInstruction = `You are an expert ATS (Applicant Tracking System) Analyzer.
I will provide a Job Description and a Resume.
Analyze the resume strictly against the job description.
Provide the output strictly in the following JSON format without any markdown wrappers or additional text:
{
  "atsScore": 85,
  "stars": 4.5,
  "grammarScore": 90,
  "impactScore": 80,
  "rating": "Strong Match",
  "missingSkills": ["skill1"],
  "suggestions": ["suggestion1"]
}`;

    const userMessage = `Job Description:\n${jobDescription}\n\nResume text:\n${resumeText}`;
    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userMessage }
    ];

    let reply = await callAIWithFallback(messages, systemInstruction, true);
    
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (jsonMatch) reply = jsonMatch[0];
    
    const parsedData = JSON.parse(reply);
    res.json(parsedData);

  } catch (error) {
    console.error('AI Resume Analyze Error:', error);
    res.status(500).json({ message: `Failed to analyze resume: ${error.message}` });
  }
});

// @route   POST /api/ai/draft-request
// @desc    Draft a mentorship request message
// @access  Private
router.post('/draft-request', protect, async (req, res) => {
  try {
    const { mentorProfile, studentProfile } = req.body;

    if (!mentorProfile) {
      return res.status(400).json({ message: 'Mentor profile data is required' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({ draft: "Hi! I am a student interested in your field. I would love to connect and learn from your experiences." });
    }

    const systemInstruction = "You are an expert networking assistant. Write a short, professional, and personalized LinkedIn-style connection request message (max 3 sentences) from a student to an alumni mentor. Do not include placeholders like [Your Name] unless absolutely necessary, use the student's actual name if provided.";

    const userMessage = `Mentor Details:
Name: ${mentorProfile.name || 'Alumnus'}
Headline: ${mentorProfile.headline || ''}
Industry: ${mentorProfile.industry || ''}
Company: ${mentorProfile.company || ''}

Student Details:
Name: ${studentProfile?.name || 'Student'}
Headline: ${studentProfile?.headline || ''}

Please draft the message.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userMessage }
    ];

    const reply = await callAIWithFallback(messages, systemInstruction, false);
    res.json({ draft: reply.trim() });

  } catch (error) {
    console.error('AI Draft Request Error:', error);
    res.status(500).json({ message: `Failed to draft request: ${error.message}` });
  }
});

// @route   POST /api/ai/match-job
// @desc    Evaluate student skills against a job description
// @access  Private
router.post('/match-job', protect, async (req, res) => {
  try {
    const { jobDescription, studentSkills, studentExperience } = req.body;

    if (!jobDescription || !studentSkills) {
      return res.status(400).json({ message: 'Job description and student skills are required' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        matchScore: 75,
        verdict: "Good Match (Mock)",
        strengths: ["Mock Strength 1"],
        weaknesses: ["Mock Weakness 1"]
      });
    }

    const systemInstruction = `You are an expert AI Technical Recruiter. Evaluate the student's skills against the job description.
Reply strictly with a JSON object:
{
  "matchScore": 85,
  "verdict": "Strong Match",
  "strengths": ["React", "Node.js"],
  "weaknesses": ["Docker"]
}`;

    const userMessage = `Job Description:\n${jobDescription}\n\nStudent Skills:\n${studentSkills}\n\nStudent Experience:\n${studentExperience || 'None provided'}`;

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userMessage }
    ];

    let reply = await callAIWithFallback(messages, systemInstruction, true);
    
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (jsonMatch) reply = jsonMatch[0];
    
    const parsedData = JSON.parse(reply);
    res.json(parsedData);

  } catch (error) {
    console.error('AI Job Match Error:', error);
    res.status(500).json({ message: `Failed to match job: ${error.message}` });
  }
});

// @route   POST /api/ai/mock-interview
// @desc    Chat with AI Mock Interviewer
// @access  Private
router.post('/mock-interview', protect, async (req, res) => {
  try {
    const { message, history, role, experience } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({ reply: "I'm your Mock Interviewer. (Demo Mode) Let's start with a question: What is your biggest strength?" });
    }

    const formattedHistory = [];
    const systemInstruction = `You are a strict and professional technical interviewer for the role of ${role || 'Software Engineer'} (Experience level: ${experience || 'Entry-Level'}). 
Conduct a mock interview. Ask one question at a time. Wait for the user's answer, evaluate it briefly, provide constructive feedback, and then ask the next question. Do not break character. Keep responses concise.`;
    
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

    formattedHistory.push({ role: 'user', content: message });

    const reply = await callAIWithFallback(formattedHistory, systemInstruction, false);
    res.json({ reply });

  } catch (error) {
    console.error('AI Mock Interview Error:', error);
    res.status(500).json({ message: `API Error: ${error.message}` });
  }
});

module.exports = router;
