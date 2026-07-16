const axios = require('axios');
const cheerio = require('cheerio');

async function testGFG() {
  try {
    const url = 'https://www.geeksforgeeks.org/user/srimankumar06/';
    console.log('Fetching', url);
    const r = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(r.data);
    const scoreText = $('.score_card_value').text();
    console.log('GFG Score Card Value:', scoreText);
    
    // Look for alternative elements if the class changed
    console.log('Title:', $('title').text());
    
    // Let's dump the HTML of elements containing "Score"
    $('*').each((i, el) => {
        const text = $(el).text();
        if (text.includes('Coding Score') && text.length < 50) {
            console.log('Found Coding Score text in element:', el.tagName, $(el).attr('class'), text);
        }
    });

  } catch (e) {
    console.error('GFG error:', e.message);
  }
}

async function testHR() {
  try {
    const url = 'https://www.hackerrank.com/rest/hackers/srimankumar06/profile';
    console.log('Fetching', url);
    const r = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    console.log('HR Profile:', Object.keys(r.data.model));
  } catch (e) {
    console.error('HR error:', e.message);
  }
}

testGFG();
testHR();
