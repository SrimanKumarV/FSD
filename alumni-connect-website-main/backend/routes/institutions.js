const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

let indianCollegesCache = null;
let isFetchingColleges = false;

// Pre-fetch the Indian colleges cache on module load if possible
function fetchIndianColleges() {
    if (indianCollegesCache || isFetchingColleges) return;
    
    isFetchingColleges = true;
    console.log('[Institutions API] Fetching Indian colleges list...');
    
    fetch('https://raw.githubusercontent.com/VarthanV/Indian-Colleges-List/master/colleges.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            // Some data sources have 'college' key, extract them and remove "(Id: ...)" part for clean names
            indianCollegesCache = data
                .map(item => {
                    let name = item.college || item.name || '';
                    // Remove the "(Id: C-39230)" suffix if it exists
                    return name.replace(/\s*\(Id:\s*[^)]+\)$/i, '').trim();
                })
                .filter(name => name.length > 0);
                
            console.log(`[Institutions API] Successfully cached ${indianCollegesCache.length} Indian colleges.`);
            isFetchingColleges = false;
        })
        .catch(err => {
            console.error('[Institutions API] Failed to fetch Indian colleges:', err);
            isFetchingColleges = false;
        });
}

// Start fetching right away so it's ready when users need it
fetchIndianColleges();

router.get('/search', async (req, res) => {
    const country = req.query.country || '';
    const name = req.query.name || '';
    
    let results = [];
    
    try {
        // 1. Fetch from HipoLabs (Worldwide universities)
        const hipoUrl = name 
            ? `http://universities.hipolabs.com/search?country=${encodeURIComponent(country)}&name=${encodeURIComponent(name)}`
            : `http://universities.hipolabs.com/search?country=${encodeURIComponent(country)}`;
            
        try {
            const hipoRes = await fetch(hipoUrl);
            if (hipoRes.ok) {
                const hipoData = await hipoRes.json();
                results = [...results, ...hipoData.map(u => u.name)];
            }
        } catch (fetchErr) {
            console.error('[Institutions API] HipoLabs fetch failed:', fetchErr);
        }
        
        // 2. If country is India, also search the Indian Colleges List
        if (country.toLowerCase() === 'india') {
            // Trigger fetch if it hasn't been fetched yet
            if (!indianCollegesCache) {
                fetchIndianColleges();
            }
            
            if (indianCollegesCache) {
                const queryLower = name.toLowerCase();
                const filteredColleges = name 
                    ? indianCollegesCache.filter(c => c.toLowerCase().includes(queryLower))
                    : indianCollegesCache; 
                
                results = [...results, ...filteredColleges];
            }
        }
        
        // Remove duplicates and limit to 50
        const uniqueResults = [...new Set(results)].slice(0, 50);
        
        // Ensure we always return an array
        res.json(uniqueResults || []);
        
    } catch (err) {
        console.error('[Institutions API] Institution search error:', err);
        res.status(500).json({ message: 'Failed to fetch institutions' });
    }
});

// @route   POST /api/institutions/extract-profile
// @desc    Extract college profile from officialUrl using Web Scraping + AI
// @access  Private (College only)
router.post('/extract-profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || user.role !== 'college') {
            return res.status(403).json({ message: 'Access denied. Only college accounts can perform this action.' });
        }
        
        const url = user.collegeInfo?.officialUrl;
        
        if (!url) {
            return res.status(400).json({ message: 'No official URL found in your profile. Please update your profile first.' });
        }
        
        // 1. Scrape the website
        console.log(`[Institutions API] Scraping website: ${url}`);
        let html;
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000 // 10 seconds timeout
            });
            html = response.data;
        } catch (err) {
            console.error('[Institutions API] Scrape Error:', err.message);
            return res.status(400).json({ message: 'Could not access the college website. It may be protected or unreachable.' });
        }
        
        // 2. Parse text with Cheerio
        const $ = cheerio.load(html);
        
        // Remove scripts, styles, noscript, etc to clean up text
        $('script, style, noscript, iframe, img, svg, video').remove();
        
        let scrapedText = '';
        
        // Extract meta description
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        if (metaDesc) scrapedText += `Description: ${metaDesc}\n\n`;
        
        // Extract main headings and paragraphs
        $('h1, h2, h3, p, li').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 20) { // Only keep substantial text
                scrapedText += text + '\n';
            }
        });
        
        // Limit text to avoid exceeding LLM context window (Llama-3 handles ~8k tokens, so 12000 chars is safe)
        scrapedText = scrapedText.substring(0, 12000);
        
        // 3. Send to Groq AI to summarize and extract info
        const apiKey = process.env.GROQ_API_KEY?.trim();
        
        let extractedData = {
            aboutUs: "Data could not be extracted.",
            mission: "",
            vision: "",
            contactEmail: "",
            contactPhone: "",
            address: "",
            departments: [],
            programs: { ug: [], pg: [], phd: [] },
            clubsAndCells: [],
            facilities: [],
            placements: { highestPackage: "", averagePackage: "", topCompanies: [] },
            upcomingEvents: []
        };
        
        if (apiKey) {
            console.log(`[Institutions API] Sending data to Groq AI for extraction`);
            
            const prompt = `
You are an AI assistant tasked with deeply analyzing a college's scraped website text.
Extract the following highly structured information. Be thorough and exhaustive.
1. "aboutUs": A concise summary of the college (max 3 sentences).
2. "mission": The college's mission statement, if found.
3. "vision": The college's vision statement, if found.
4. "contactEmail": Any official contact email address found.
5. "contactPhone": Any official contact phone number found.
6. "address": The physical address of the college, if found.
7. "departments": A JSON array of strings listing all academic departments (e.g. ["Computer Science", "Mechanical Engineering"]).
8. "programs": A JSON object containing three arrays of strings: "ug" (Undergraduate programs like B.Tech, B.Sc), "pg" (Postgraduate programs like M.Tech, MBA), and "phd" (Doctoral programs).
9. "clubsAndCells": A JSON array of strings listing all student clubs, cells, organizations, or societies.
10. "facilities": A JSON array of strings listing campus facilities (e.g. ["Library", "Hostel", "Sports Complex"]).
11. "placements": A JSON object containing "highestPackage" (string), "averagePackage" (string), and "topCompanies" (JSON array of strings).
12. "upcomingEvents": A JSON array of objects, where each object has "title" (string), "date" (string), and "description" (string).

If any field or list is not found, leave it as an empty string "" or empty array [].
Respond ONLY with a valid JSON object matching the exact keys above. No markdown formatting like \`\`\`json.

Here is the scraped text:
${scrapedText}
`;
            try {
                const aiResponse = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                const aiResultText = aiResponse.data.choices[0].message.content;
                const parsedResult = JSON.parse(aiResultText);
                
                extractedData = {
                    aboutUs: parsedResult.aboutUs || extractedData.aboutUs,
                    mission: parsedResult.mission || "",
                    vision: parsedResult.vision || "",
                    contactEmail: parsedResult.contactEmail || "",
                    contactPhone: parsedResult.contactPhone || "",
                    address: parsedResult.address || ""
                };
            } catch (aiErr) {
                console.error('[Institutions API] Groq AI Error:', aiErr.response ? aiErr.response.data : aiErr.message);
                // Fallback if AI fails: just use the meta description
                extractedData.aboutUs = metaDesc || "AI Extraction failed, but here is a raw snippet: " + scrapedText.substring(0, 100) + "...";
            }
        } else {
            console.log(`[Institutions API] No Groq API Key found. Falling back to basic extraction.`);
            extractedData.aboutUs = metaDesc || (scrapedText.substring(0, 200) + '...');
        }
        
        extractedData.lastExtractedAt = new Date();
        
        // 4. Save to database
        user.collegeInfo = user.collegeInfo || {};
        user.collegeInfo.extractedProfile = extractedData;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Profile successfully extracted and saved.',
            data: extractedData
        });
        
    } catch (err) {
        console.error('[Institutions API] Route error:', err);
        res.status(500).json({ message: 'Server error during profile extraction.' });
    }
});

const STANDARD_DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Business Administration',
  'Master of Computer Applications (MCA)',
  'Artificial Intelligence and Data Science'
];

// @route   GET /api/institutions/departments
// @desc    Get available departments (optionally for a specific college)
// @access  Public
router.get('/departments', async (req, res) => {
    const { college } = req.query;
    try {
        let departments = [...STANDARD_DEPARTMENTS];
        
        if (college) {
            // Find if a college registered and has scraped departments
            const collegeUser = await User.findOne({ 
                role: 'college', 
                name: new RegExp(`^${college.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
            });
            
            if (collegeUser && collegeUser.collegeInfo?.extractedProfile?.departments?.length > 0) {
                const scrapedDepts = collegeUser.collegeInfo.extractedProfile.departments;
                for (const dept of scrapedDepts) {
                    if (!departments.includes(dept)) {
                        departments.push(dept);
                    }
                }
            }
        }
        
        res.json(departments.sort());
    } catch (err) {
        console.error('[Institutions API] Department fetch error:', err);
        res.json(STANDARD_DEPARTMENTS.sort());
    }
});

module.exports = router;
