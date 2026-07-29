const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const fetchGitHubStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': 'AlumnexConnect-App' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    const [apiRes, htmlRes] = await Promise.allSettled([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(`https://github.com/${username}`, { headers: { 'User-Agent': BROWSER_UA } }),
    ]);
    if (apiRes.status !== 'fulfilled') return null;
    const data = apiRes.value.data;

    const realBadges = [];
    if (htmlRes.status === 'fulfilled') {
      const $ = cheerio.load(htmlRes.value.data);
      $('[data-hovercard-type="achievement"] img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = ($(el).attr('alt') || 'Achievement').replace(/^Achievement: /, '');
        if (src && !realBadges.find(b => b.imageUrl === src)) {
          realBadges.push({ id: alt.toLowerCase().replace(/[^a-z0-9]/g, '-'), name: alt, imageUrl: src, icon: '🏅', color: '#238636', type: 'achievement' });
        }
      });
    }

    const yearsOnGithub = Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24 * 365));
    const milestoneBadges = [];
    if (data.public_repos >= 1)  milestoneBadges.push({ id: 'gh-1-repo',  name: 'First Repository', icon: '📁', color: '#6e7681' });
    if (data.public_repos >= 5)  milestoneBadges.push({ id: 'gh-5-repos', name: '5 Repositories',   icon: '📂', color: '#238636' });
    if (data.public_repos >= 10) milestoneBadges.push({ id: 'gh-10-repos',name: '10 Repositories',  icon: '🌐', color: '#1f6feb' });
    if (data.public_repos >= 50) milestoneBadges.push({ id: 'gh-50-repos',name: 'Prolific Dev',      icon: '🚀', color: '#1f6feb' });
    if (data.followers >= 10)    milestoneBadges.push({ id: 'gh-10-fol',  name: '10 Followers',     icon: '⭐', color: '#e3b341' });
    if (data.followers >= 100)   milestoneBadges.push({ id: 'gh-100-fol', name: '100 Followers',    icon: '🌟', color: '#f78166' });
    if (yearsOnGithub >= 1) milestoneBadges.push({ id: `gh-${yearsOnGithub}yr`, name: `${yearsOnGithub}yr Veteran`, icon: '🏛️', color: '#8b5cf6' });

    return { publicRepos: data.public_repos, followers: data.followers, following: data.following, createdAt: data.created_at, url: data.html_url, badges: [...realBadges, ...milestoneBadges] };
  } catch (error) {
    console.error(`GitHub fetch failed for ${username}:`, error.message);
    return null;
  }
};

const fetchLeetCodeStats = async (username) => {
  if (!username) return null;
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats: submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
          profile { ranking reputation starRating }
          userCalendar { submissionCalendar }
          badges { id name displayName icon creationDate medal { slug config { iconGif iconGifBackground } } }
          activeBadge { id displayName icon creationDate }
          userContestRanking { rating globalRanking attendedContestsCount }
        }
      }
    `;
    const response = await axios.post('https://leetcode.com/graphql', { query, variables: { username } }, {
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': BROWSER_UA }
    });
    if (response.data.errors) return null;
    const user = response.data.data.matchedUser;
    if (!user) return null;

    const totalSolved  = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'All')?.count || 0;
    const easySolved   = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Easy')?.count || 0;
    const mediumSolved = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Medium')?.count || 0;
    const hardSolved   = user.submitStats.acSubmissionNum.find(d => d.difficulty === 'Hard')?.count || 0;

    const badges = (user.badges || []).map(b => {
      let imageUrl = null;
      if (b.medal?.config?.iconGif) imageUrl = b.medal.config.iconGif.startsWith('http') ? b.medal.config.iconGif : `https://leetcode.com${b.medal.config.iconGif}`;
      else if (b.icon) imageUrl = b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`;
      return { id: b.id, name: b.displayName || b.name, imageUrl, icon: '🏅', color: '#f59e0b', earnedAt: b.creationDate, type: 'real' };
    });

    if (totalSolved >= 50)  badges.push({ id: 'lc-50',   name: '50 Solved',   icon: '🥉', color: '#cd7f32' });
    if (totalSolved >= 100) badges.push({ id: 'lc-100',  name: '100 Solved',  icon: '🥈', color: '#94a3b8' });
    if (totalSolved >= 200) badges.push({ id: 'lc-200',  name: '200 Solved',  icon: '🥇', color: '#f59e0b' });
    if (totalSolved >= 500) badges.push({ id: 'lc-500',  name: '500 Solved',  icon: '💎', color: '#06b6d4' });
    if (hardSolved >= 10)   badges.push({ id: 'lc-h10',  name: '10 Hard',     icon: '🔥', color: '#ef4444' });
    if (hardSolved >= 50)   badges.push({ id: 'lc-h50',  name: '50 Hard',     icon: '🔱', color: '#dc2626' });

    const ci = user.userContestRanking;
    if (ci?.attendedContestsCount >= 1) badges.push({ id: 'lc-contest', name: `${ci.attendedContestsCount} Contests`, icon: '🏆', color: '#f59e0b' });

    return { totalSolved, easySolved, mediumSolved, hardSolved, ranking: user.profile.ranking, reputation: user.profile.reputation,
      calendar: user.userCalendar?.submissionCalendar ? JSON.parse(user.userCalendar.submissionCalendar) : null,
      url: `https://leetcode.com/${username}`, badges, activeBadge: user.activeBadge, contestRating: ci?.rating };
  } catch (error) {
    console.error(`LeetCode fetch failed for ${username}:`, error.message);
    return null;
  }
};

const fetchHackerRankStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': BROWSER_UA };
    const [profileRes, badgesRes] = await Promise.all([
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/profile`, { headers }),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers }),
    ]);
    const model = profileRes.data.model;
    const rawBadges = badgesRes.data.models || [];
    const starColors = ['#94a3b8', '#10b981', '#22c55e', '#f59e0b', '#f97316', '#ef4444'];
    const badges = rawBadges.map(b => {
      const stars = b.stars || 1;
      const slug = (b.name || '').toLowerCase().replace(/\s+/g, '-');
      return {
        id: b.id || slug, name: b.name,
        imageUrl: `https://hrcdn.net/fcore/assets/badges/${slug}-${stars}star-new.svg`,
        icon: '⭐'.repeat(Math.min(stars, 5)), stars, color: starColors[Math.min(stars - 1, 5)],
        domain: b.badge_family || '', type: 'real',
      };
    });
    return { name: model.name, level: model.level, followers: model.followers_count, badgesCount: badges.length, url: `https://www.hackerrank.com/profile/${username}`, badges };
  } catch (error) {
    console.warn(`HackerRank fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

const fetchGFGStats = async (username) => {
  if (!username) return null;
  try {
    const [apiRes, htmlRes] = await Promise.allSettled([
      axios.get(`https://authapi.geeksforgeeks.org/api-get/?itm=user-rank&user_name=${username}`, { headers: { 'User-Agent': BROWSER_UA } }),
      axios.get(`https://www.geeksforgeeks.org/user/${username}/`, { headers: { 'User-Agent': BROWSER_UA } }),
    ]);
    if (htmlRes.status !== 'fulfilled') return null;
    const $ = cheerio.load(htmlRes.value.data);
    const codingScore    = parseInt($('.score_card_value').eq(0).text().trim(), 10) || 0;
    const problemsSolved = parseInt($('.score_card_value').eq(1).text().trim(), 10) || 0;
    const streakText     = $('[class*="streak"]').text() || '';
    const currentStreak  = parseInt(streakText.match(/\d+/)?.[0] || '0', 10);
    const instituteRank  = apiRes.status === 'fulfilled' ? (apiRes.value.data?.data?.institute_rank || null) : null;

    const badges = [];
    if (problemsSolved >= 1)   badges.push({ id: 'gfg-1',    name: 'First Solve',   icon: '🌱', color: '#10b981' });
    if (problemsSolved >= 10)  badges.push({ id: 'gfg-10',   name: '10 Problems',   icon: '🌿', color: '#10b981' });
    if (problemsSolved >= 50)  badges.push({ id: 'gfg-50',   name: '50 Problems',   icon: '🌳', color: '#059669' });
    if (problemsSolved >= 100) badges.push({ id: 'gfg-100',  name: '100 Problems',  icon: '🏆', color: '#047857' });
    if (problemsSolved >= 200) badges.push({ id: 'gfg-200',  name: '200 Problems',  icon: '🔰', color: '#d97706' });
    if (problemsSolved >= 500) badges.push({ id: 'gfg-500',  name: '500 Problems',  icon: '💠', color: '#7c3aed' });
    if (codingScore >= 100)    badges.push({ id: 'gfg-s100', name: 'Score 100+',    icon: '⭐', color: '#f59e0b' });
    if (codingScore >= 500)    badges.push({ id: 'gfg-s500', name: 'Score 500+',    icon: '🌟', color: '#f59e0b' });
    if (codingScore >= 1000)   badges.push({ id: 'gfg-s1k',  name: 'Score 1000+',   icon: '💫', color: '#fbbf24' });
    if (currentStreak >= 7)    badges.push({ id: 'gfg-str',  name: `${currentStreak}d Streak`, icon: '🔥', color: '#ef4444' });
    if (instituteRank && parseInt(instituteRank) <= 10)
      badges.push({ id: 'gfg-top10', name: `Rank #${instituteRank}`, icon: '🥇', color: '#f59e0b' });

    if (!codingScore && !problemsSolved) throw new Error('Stats not found');
    return { codingScore, problemsSolved, currentStreak, instituteRank, url: `https://www.geeksforgeeks.org/user/${username}/`, badges };
  } catch (error) {
    console.warn(`GFG fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

const fetchCodechefStats = async (username) => {
  if (!username) return null;
  try {
    const response = await axios.get(`https://www.codechef.com/users/${username}`, { headers: { 'User-Agent': BROWSER_UA } });
    const $ = cheerio.load(response.data);
    const rating = parseInt($('.rating-number').text(), 10);
    if (isNaN(rating)) throw new Error('Rating not found');
    const starsStr = $('.rating-star').text();
    const stars = (starsStr.match(/★/g) || []).length || 1;
    const problemsSolved = parseInt($('section.rating-data-section.problems-solved h3').text().match(/\d+/)?.[0] || '0', 10);
    let division = 4;
    if (rating >= 1400) division = 3;
    if (rating >= 1600) division = 2;
    if (rating >= 1800) division = 1;
    const starBadgeColors = ['#92400e', '#94a3b8', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#06b6d4'];
    const divColors = { 1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#22c55e' };
    const badges = [];
    badges.push({ id: `cc-${stars}star`, name: `${stars}★ Rated`, icon: '⭐'.repeat(Math.min(stars, 5)),
      imageUrl: `https://cdn.codechef.com/sites/all/themes/abessive/images/user/${stars}star.svg`,
      color: starBadgeColors[stars - 1] || '#f59e0b', type: 'real' });
    badges.push({ id: `cc-div${division}`, name: `Division ${division}`, icon: '🏅', color: divColors[division] });
    if (problemsSolved >= 10)  badges.push({ id: 'cc-p10',  name: '10 Problems',  icon: '🌱', color: '#10b981' });
    if (problemsSolved >= 50)  badges.push({ id: 'cc-p50',  name: '50 Problems',  icon: '🌿', color: '#059669' });
    if (problemsSolved >= 100) badges.push({ id: 'cc-p100', name: '100 Problems', icon: '🌳', color: '#047857' });
    if (rating >= 1200) badges.push({ id: 'cc-1200', name: '1200+ Rating', icon: '🥉', color: '#cd7f32' });
    if (rating >= 1600) badges.push({ id: 'cc-1600', name: '1600+ Rating', icon: '🥇', color: '#f59e0b' });
    if (rating >= 1800) badges.push({ id: 'cc-1800', name: '1800+ Rating', icon: '💎', color: '#06b6d4' });
    return { rating, stars, division, problemsSolved, url: `https://www.codechef.com/users/${username}`, badges };
  } catch (error) {
    console.warn(`CodeChef scrape failed for ${username}: ${error.message}`);
    return null;
  }
};

const fetchCodeforcesStats = async (username) => {
  if (!username) return null;
  try {
    const [infoRes, ratingRes] = await Promise.allSettled([
      axios.get(`https://codeforces.com/api/user.info?handles=${username}`),
      axios.get(`https://codeforces.com/api/user.rating?handle=${username}`),
    ]);
    if (infoRes.status !== 'fulfilled' || infoRes.value.data.status !== 'OK') return null;
    const user = infoRes.value.data.result[0];
    const rating = user.rating || 0;
    const maxRating = user.maxRating || 0;
    const rank = user.rank || 'newbie';
    const maxRank = user.maxRank || rank;
    const rankColors = { newbie:'#808080',pupil:'#008000',specialist:'#03a89e',expert:'#0000ff','candidate master':'#aa00aa',master:'#ff8c00','international master':'#ff8c00',grandmaster:'#ff0000','international grandmaster':'#ff0000','legendary grandmaster':'#ff0000' };
    const rankIcons  = { newbie:'🔰',pupil:'🌱',specialist:'💻',expert:'🧠','candidate master':'👑',master:'🔱','international master':'🏆',grandmaster:'⚡','international grandmaster':'🌟','legendary grandmaster':'💫' };
    const toTitle = s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const color = rankColors[rank.toLowerCase()] || '#808080';
    const badges = [
      { id: `cf-rank-${rank.replace(/\s+/g,'-')}`, name: toTitle(rank), icon: rankIcons[rank.toLowerCase()]||'🎖️', color, type: 'rank' }
    ];
    if (maxRank && maxRank !== rank)
      badges.push({ id: `cf-peak-${maxRank.replace(/\s+/g,'-')}`, name: `Peak: ${toTitle(maxRank)}`, icon: rankIcons[maxRank.toLowerCase()]||'📈', color: rankColors[maxRank.toLowerCase()]||'#f59e0b', type: 'peak' });
    if (rating >= 1200) badges.push({ id:'cf-1200', name:'1200+', icon:'🌿', color:'#008000' });
    if (rating >= 1400) badges.push({ id:'cf-1400', name:'1400+', icon:'💻', color:'#03a89e' });
    if (rating >= 1600) badges.push({ id:'cf-1600', name:'1600+', icon:'🧠', color:'#0000ff' });
    if (rating >= 1900) badges.push({ id:'cf-1900', name:'1900+', icon:'👑', color:'#aa00aa' });
    if (rating >= 2100) badges.push({ id:'cf-2100', name:'2100+', icon:'🔱', color:'#ff8c00' });
    const contestCount = ratingRes.status==='fulfilled' && Array.isArray(ratingRes.value?.data?.result) ? ratingRes.value.data.result.length : 0;
    if (contestCount >= 1)  badges.push({ id:'cf-c1',  name:'Contestant',               icon:'🏁', color:'#64748b' });
    if (contestCount >= 10) badges.push({ id:'cf-c10', name:`${contestCount} Contests`,  icon:'🏆', color:'#f59e0b' });
    if (contestCount >= 50) badges.push({ id:'cf-c50', name:'Contest Veteran',           icon:'🌟', color:'#fbbf24' });
    return { rating, maxRating, rank, maxRank, contestCount, url: `https://codeforces.com/profile/${username}`, badges };
  } catch (error) {
    console.warn(`Codeforces fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

module.exports = { fetchGitHubStats, fetchLeetCodeStats, fetchHackerRankStats, fetchGFGStats, fetchCodechefStats, fetchCodeforcesStats };
