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
    const data = response.data;

    const badges = [];
    if (data.public_repos >= 1)   badges.push({ id: 'first-repo', name: 'First Repository', icon: '📁', color: '#6e7681' });
    if (data.public_repos >= 10)  badges.push({ id: 'open-sourcer', name: 'Open Sourcer', icon: '🌐', color: '#238636' });
    if (data.public_repos >= 50)  badges.push({ id: 'prolific-dev', name: 'Prolific Developer', icon: '🚀', color: '#1f6feb' });
    if (data.followers >= 10)     badges.push({ id: 'popular', name: 'Popular', icon: '⭐', color: '#e3b341' });
    if (data.followers >= 100)    badges.push({ id: 'influencer', name: 'Influencer', icon: '🌟', color: '#f78166' });
    const yearsOnGithub = Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24 * 365));
    if (yearsOnGithub >= 1) badges.push({ id: 'veteran', name: `${yearsOnGithub}yr GitHub Veteran`, icon: '🏛️', color: '#8b5cf6' });
    if (data.public_repos >= 1 && data.followers >= 1) badges.push({ id: 'contributor', name: 'Contributor', icon: '🤝', color: '#22c55e' });

    return {
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
      url: data.html_url,
      badges,
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
          userCalendar {
            submissionCalendar
          }
          badges {
            id
            name
            icon
            displayName
            creationDate
          }
          activeBadge { id displayName icon creationDate }
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
    
    const rawBadges = user.badges || [];
    const badges = rawBadges.map(b => ({
      id: b.id,
      name: b.displayName || b.name,
      icon: b.icon || '🏅',
      color: '#f59e0b',
      earnedAt: b.creationDate,
    }));

    if (totalSolved >= 50)   badges.push({ id: 'lc-50',   name: '50 Problems',   icon: '🥉', color: '#cd7f32' });
    if (totalSolved >= 100)  badges.push({ id: 'lc-100',  name: '100 Problems',  icon: '🥈', color: '#94a3b8' });
    if (totalSolved >= 200)  badges.push({ id: 'lc-200',  name: '200 Problems',  icon: '🥇', color: '#f59e0b' });
    if (totalSolved >= 500)  badges.push({ id: 'lc-500',  name: '500 Problems',  icon: '💎', color: '#06b6d4' });
    if (hardSolved >= 10)    badges.push({ id: 'lc-hard', name: 'Hard Cracker',  icon: '🔥', color: '#ef4444' });

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: user.profile.ranking,
      reputation: user.profile.reputation,
      calendar: user.userCalendar?.submissionCalendar ? JSON.parse(user.userCalendar.submissionCalendar) : null,
      url: `https://leetcode.com/${username}`,
      badges,
      activeBadge: user.activeBadge,
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
    const [profileRes, badgesRes] = await Promise.all([
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, { headers }),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers }),
    ]);
    const model = profileRes.data.model;
    const rawBadges = badgesRes.data.models || [];

    const badges = rawBadges.map(b => ({
      id: b.id || b.name,
      name: b.name,
      icon: '🏆',
      stars: b.stars || 1,
      color: '#22c55e',
    }));

    return {
      name: model.name,
      level: model.level,
      followers: model.followers_count,
      badgesCount: badges.length,
      url: `https://www.hackerrank.com/profile/${username}`,
      badges,
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
    const $ = cheerio.load(response.data);
    
    const codingScore = parseInt($('.score_card_value').eq(0).text().trim(), 10) || 0;
    const problemsSolved = parseInt($('.score_card_value').eq(1).text().trim(), 10) || 0;
    
    const badges = [];
    if (problemsSolved >= 10)   badges.push({ id: 'gfg-10',   name: '10 Problems',     icon: '🌱', color: '#10b981' });
    if (problemsSolved >= 50)   badges.push({ id: 'gfg-50',   name: '50 Problems',     icon: '🌿', color: '#059669' });
    if (problemsSolved >= 100)  badges.push({ id: 'gfg-100',  name: '100 Problems',    icon: '🌳', color: '#047857' });
    if (problemsSolved >= 200)  badges.push({ id: 'gfg-200',  name: '200 Problems',    icon: '🏆', color: '#d97706' });
    if (codingScore >= 100)     badges.push({ id: 'gfg-score-100', name: 'Score 100+', icon: '⭐', color: '#f59e0b' });
    if (codingScore >= 500)     badges.push({ id: 'gfg-score-500', name: 'Score 500+', icon: '🌟', color: '#f59e0b' });

    if (!codingScore && !problemsSolved) {
      throw new Error("Stats not found in HTML");
    }
    
    return {
      codingScore,
      problemsSolved,
      url: `https://www.geeksforgeeks.org/user/${username}/`,
      badges
    };
  } catch (error) {
    console.warn(`Scraping GFG failed for ${username}, returning null.`);
    return null;
  }
};

const fetchCodechefStats = async (username) => {
  if (!username) return null;
  try {
    const response = await axios.get(`https://www.codechef.com/users/${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(response.data);
    const ratingStr = $('.rating-number').text();
    const rating = parseInt(ratingStr, 10);
    
    const starsStr = $('.rating-star').text();
    const stars = (starsStr.match(/★/g) || []).length || 1;
    
    if (isNaN(rating)) throw new Error("Rating not found");

    let division = '4';
    if (rating >= 1400) division = '3';
    if (rating >= 1600) division = '2';
    if (rating >= 1800) division = '1';

    const starBadgeColors = ['#92400e', '#94a3b8', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];
    const badges = [];
    for (let s = 1; s <= stars; s++) {
      badges.push({
        id: `cc-star-${s}`,
        name: `${s}★ Coder`,
        icon: '⭐',
        color: starBadgeColors[s - 1] || '#f59e0b',
      });
    }
    badges.push({ id: `cc-div-${division}`, name: `Division ${division}`, icon: '🏅', color: '#8b5cf6' });
    
    return {
      rating,
      stars,
      division,
      url: `https://www.codechef.com/users/${username}`,
      badges
    };
  } catch (error) {
    console.warn(`Scraping Codechef failed for ${username}, returning null.`);
    return null;
  }
};

const fetchCodeforcesStats = async (username) => {
  if (!username) return null;
  try {
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
    if (response.data.status === 'OK') {
      const user = response.data.result[0];
      const rating = user.rating || 0;
      const rank = user.rank || 'newbie';

      const rankColors = {
        newbie: '#808080', pupil: '#008000', specialist: '#03a89e',
        expert: '#0000ff', 'candidate master': '#aa00aa',
        master: '#ff8c00', 'international master': '#ff8c00',
        grandmaster: '#ff0000', 'international grandmaster': '#ff0000',
        'legendary grandmaster': '#ff0000',
      };
      const color = rankColors[rank.toLowerCase()] || '#808080';

      const badges = [
        { id: `cf-rank-${rank}`, name: rank.charAt(0).toUpperCase() + rank.slice(1), icon: '🎖️', color },
      ];
      if (rating >= 1200) badges.push({ id: 'cf-specialist', name: 'Specialist+',  icon: '💻', color: '#03a89e' });
      if (rating >= 1600) badges.push({ id: 'cf-expert',     name: 'Expert+',      icon: '🧠', color: '#0000ff' });
      if (rating >= 1900) badges.push({ id: 'cf-cmaster',    name: 'Candidate Master', icon: '👑', color: '#aa00aa' });
      if (rating >= 2100) badges.push({ id: 'cf-master',     name: 'Master',       icon: '🔱', color: '#ff8c00' });
      if (user.maxRating >= rating + 200) badges.push({ id: 'cf-peaked', name: 'Peak Achiever', icon: '📈', color: '#f59e0b' });

      return {
        rating: rating,
        maxRating: user.maxRating || 0,
        rank: rank,
        url: `https://codeforces.com/profile/${username}`,
        badges
      };
    }
    return null;
  } catch (error) {
    console.warn(`Codeforces API failed for ${username}, returning null.`);
    return null;
  }
};

module.exports = {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats,
  fetchCodechefStats,
  fetchCodeforcesStats
};
