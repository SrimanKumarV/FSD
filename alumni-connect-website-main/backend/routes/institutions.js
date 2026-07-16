const express = require('express');
const router = express.Router();

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

module.exports = router;
