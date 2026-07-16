const axios = require('axios');
const cheerio = require('cheerio');

const fetchGitHubStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': 'AlumnexConnect-App' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    const response = await axios.get(`https://api.github.com/users/${username}`, { headers });
    return {
      publicRepos: response.data.public_repos,
      followers: response.data.followers,
      following: response.data.following,
      createdAt: response.data.created_at,
      url: response.data.html_url
    };
  } catch (error) {
    console.error(`Error fetching GitHub stats for ${username}:`, error.message);
    return null;
  }
};

const fetchLeetCodeStats = async (username) => {
  if (!username) return null;
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          profile {
            ranking
            reputation
            starRating
          }
        }
      }
    `;
    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    });
    
    if (response.data.errors) return null;
    
    const user = response.data.data.matchedUser;
    if (!user) return null;
    
    const totalSolved = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'All')?.count || 0;
    const easySolved = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Easy')?.count || 0;
    const mediumSolved = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Medium')?.count || 0;
    const hardSolved = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Hard')?.count || 0;
    
    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: user.profile.ranking,
      reputation: user.profile.reputation,
      url: `https://leetcode.com/${username}`
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${username}:`, error.message);
    return null;
  }
};

const fetchHackerRankStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, { headers });
    const model = response.data.model;
    
    const badgesResponse = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers });
    const badgesCount = badgesResponse.data.models ? badgesResponse.data.models.length : 0;

    return {
      name: model.name,
      level: model.level,
      followers: model.followers_count,
      badgesCount: badgesCount,
      url: `https://www.hackerrank.com/profile/${username}`
    };
  } catch (error) {
    console.warn(`Scraping HackerRank failed for ${username}, returning null.`);
    return null;
  }
};

const fetchGFGStats = async (username) => {
  if (!username) return null;
  try {
    const url = `https://www.geeksforgeeks.org/user/${username}/`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    
    const codingScore = $('.score_card_value').eq(0).text().trim();
    const problemsSolved = $('.score_card_value').eq(1).text().trim();
    
    if (!codingScore && !problemsSolved) {
      throw new Error("Stats not found in HTML");
    }
    
    return {
      codingScore: parseInt(codingScore, 10) || 0,
      problemsSolved: parseInt(problemsSolved, 10) || 0,
      url: `https://www.geeksforgeeks.org/user/${username}/`
    };
  } catch (error) {
    console.warn(`Scraping GFG failed for ${username}, returning null.`);
    return null;
  }
};

module.exports = {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats
};
