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
    res.json({ reply: "I'm having trouble connecting to my AI brain right now. Please verify that valid API keys are configured in the backend environment variables. We can try again later!" });
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
        matchedSkills: ["React", "Node.js", "MongoDB"],
        missingSkills: ["Docker", "AWS"],
        strengths: ["Strong action verbs", "Clear formatting"],
        weaknesses: ["Missing some technical keywords"],
        suggestions: ["Add real API key for real analysis."]
      });
    }

    const systemInstruction = `You are an elite ATS (Applicant Tracking System) software used by Fortune 500 recruiters.
I will provide a Job Description and a candidate's Resume text (extracted from PDF).

Your task is to ruthlessly and realistically calculate the ATS Match Score based on these strict criteria:
1. Keyword Matching (40%): Do the exact skills, tools, and methodologies in the JD appear in the resume?
2. Impact & Metrics (30%): Does the resume use quantifiable metrics (%, $, numbers) and strong action verbs?
3. Grammar & Readability (15%): Is the text clear, professional, and free of grammatical errors?
4. Experience Relevance (15%): Does the candidate's experience align with the seniority and requirements of the role?

Output strictly in this JSON format without any markdown wrappers or additional text:
{
  "atsScore": <number 0-100, calculate realistically based on the criteria>,
  "stars": <number 1-5, allowing half stars (e.g. 3.5), correlated to atsScore>,
  "grammarScore": <number 0-100>,
  "impactScore": <number 0-100, based on use of action verbs and numbers>,
  "rating": "<string: 'Poor Match', 'Fair Match', 'Good Match', 'Strong Match', or 'Excellent Match'>",
  "matchedSkills": ["<skill 1 found in both JD and resume>", "<skill 2>"],
  "missingSkills": ["<critical keyword 1 missing from resume>", "<critical keyword 2>"],
  "strengths": ["<specific strength 1 based on resume>", "<specific strength 2>"],
  "weaknesses": ["<specific area of concern 1>", "<specific area of concern 2>"],
  "suggestions": ["<actionable tip 1 to improve>", "<actionable tip 2>"]
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
Conduct a mock interview. Follow these strict rules:
1. Ask ONE question at a time.
2. Wait for the user's answer, evaluate it briefly (1-2 sentences), provide constructive feedback, and then ask the NEXT question.
3. NEVER repeat a question. Analyze the conversation history carefully before asking your next question.
4. Rotate through different topics (e.g., core concepts, behavioral, problem-solving, system design) so the interview feels dynamic.
5. Do not break character. Keep responses concise.`;
    
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

    formattedHistory.push({ 
      role: 'user', 
      content: `${message}\n\n[System Note to AI: Evaluate the answer above briefly, then ask a completely NEW question on a DIFFERENT topic. Do NOT repeat previous questions.]` 
    });

    const reply = await callAIWithFallback(formattedHistory, systemInstruction, false);
    res.json({ reply });

  } catch (error) {
    console.error('AI Mock Interview Error:', error);
    res.json({ reply: "I'm having trouble connecting to my AI brain right now. Please verify that valid API keys are configured in the backend environment variables. We can try again later!" });
  }
});
// @route   POST /api/ai/evaluate-interview
// @desc    Evaluate the entire mock interview session
// @access  Private
router.post('/evaluate-interview', protect, async (req, res) => {
  try {
    const { history, role, experience } = req.body;

    if (!history || history.length === 0) {
      return res.status(400).json({ message: 'Interview history is required' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.json({
        score: 80,
        feedback: "Great job! This is a mock evaluation.",
        strengths: ["Clear communication", "Good problem solving"],
        weaknesses: ["Could be more detailed"],
        tips: ["Practice more system design"]
      });
    }

    const systemInstruction = `You are an expert technical recruiter. Review the following interview transcript for a ${experience || 'Entry-Level'} ${role || 'Software Engineer'}.
Provide a strict JSON evaluation with the following format:
{
  "score": <number 0-100 overall performance score>,
  "feedback": "<string: 2-3 sentences of overall constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>"]
}`;

    const formattedHistory = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
    const userMessage = `Please evaluate this interview transcript:\n\n${formattedHistory}`;

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
    console.error('AI Interview Evaluation Error:', error);
    res.status(500).json({ message: `Failed to evaluate interview: ${error.message}` });
  }
});

module.exports = router;
