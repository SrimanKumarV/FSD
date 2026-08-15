const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const fetchGitHubStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': BROWSER_UA };
    
    // Check if token is available
    if (!process.env.GITHUB_TOKEN) {
       console.warn("GITHUB_TOKEN is missing in env, GitHub detailed fetch may fail or be rate limited.");
    } else {
       // Clean token in case of weird whitespace
       const token = process.env.GITHUB_TOKEN.replace(/\s+/g, '');
       headers['Authorization'] = `bearer ${token}`;
    }

    const query = `
      query($login: String!) {
        user(login: $login) {
          createdAt
          url
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
            nodes {
              stargazerCount
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges { size node { name color } }
              }
            }
          }
          pullRequests(first: 1) { totalCount }
          issues(first: 1) { totalCount }
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks { contributionDays { date contributionCount color } }
            }
          }
          followers { totalCount }
          following { totalCount }
        }
      }
    `;

    const [graphqlRes, htmlRes] = await Promise.allSettled([
      axios.post('https://api.github.com/graphql', { query, variables: { login: username } }, { headers }),
      axios.get(`https://github.com/${username}`, { headers: { 'User-Agent': BROWSER_UA } })
    ]);

    if (graphqlRes.status !== 'fulfilled' || graphqlRes.value.data.errors) {
       // fallback to old logic if GraphQL fails (e.g. no token)
       const apiRes = await axios.get(`https://api.github.com/users/${username}`, { headers: { 'User-Agent': BROWSER_UA, ...(process.env.GITHUB_TOKEN && {'Authorization': `token ${process.env.GITHUB_TOKEN.replace(/\s+/g, '')}`}) } });
       const data = apiRes.data;
       return { publicRepos: data.public_repos, followers: data.followers, following: data.following, createdAt: data.created_at, url: data.html_url, badges: [] };
    }

    const data = graphqlRes.value.data.data.user;
    if (!data) return null;

    // Process languages
    const langSize = {};
    const langColor = {};
    let totalSize = 0;
    
    data.repositories.nodes.forEach(repo => {
      repo.languages.edges.forEach(edge => {
        langSize[edge.node.name] = (langSize[edge.node.name] || 0) + edge.size;
        langColor[edge.node.name] = edge.node.color;
        totalSize += edge.size;
      });
    });

    const languages = Object.entries(langSize).map(([name, size]) => ({
      name, size, color: langColor[name], percentage: ((size / totalSize) * 100).toFixed(1)
    })).sort((a, b) => b.size - a.size).slice(0, 6);

    const stars = data.repositories.nodes.reduce((acc, r) => acc + r.stargazerCount, 0);
    const heatmapPoints = [];
    let maxStreak = 0, currentStreak = 0, tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    data.contributionsCollection.contributionCalendar.weeks.forEach(w => {
      w.contributionDays.forEach(d => {
        if (d.contributionCount > 0) {
          heatmapPoints.push({ date: d.date, count: d.contributionCount });
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
          if (d.date === today) currentStreak = tempStreak;
        } else {
          if (d.date !== today || tempStreak > 0) {
            if (d.date < today) currentStreak = tempStreak; // Last known streak before today
            tempStreak = 0;
          }
        }
      });
    });

    // Scrape real badges
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

    return {
      followers: data.followers.totalCount,
      following: data.following.totalCount,
      publicRepos: data.repositories.nodes.length,
      stars,
      pullRequests: data.pullRequests.totalCount,
      issues: data.issues.totalCount,
      totalContributions: data.contributionsCollection.contributionCalendar.totalContributions,
      languages,
      heatmap: { points: heatmapPoints, maxStreak, currentStreak },
      createdAt: data.createdAt,
      url: data.url,
      badges: realBadges
    };
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
          tagProblemCounts {
            advanced { tagName problemsSolved }
            intermediate { tagName problemsSolved }
            fundamental { tagName problemsSolved }
          }
        }
        userContestRanking(username: $username) { rating globalRanking attendedContestsCount }
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

    const ci = response.data.data.userContestRanking;

    let topics = [];
    if (user.tagProblemCounts) {
      const { advanced = [], intermediate = [], fundamental = [] } = user.tagProblemCounts;
      topics = [...advanced, ...intermediate, ...fundamental]
        .map(t => ({ name: t.tagName, solved: t.problemsSolved }))
        .sort((a, b) => b.solved - a.solved); // highest solved first
    }

    return { totalSolved, easySolved, mediumSolved, hardSolved, ranking: user.profile.ranking, reputation: user.profile.reputation,
      calendar: user.userCalendar?.submissionCalendar ? JSON.parse(user.userCalendar.submissionCalendar) : null,
      url: `https://leetcode.com/${username}`, badges, activeBadge: user.activeBadge, contestRating: ci?.rating, topics };
  } catch (error) {
    console.error(`LeetCode fetch failed for ${username}:`, error.message);
    return null;
  }
};

const fetchHackerRankStats = async (username) => {
  if (!username) return null;
  try {
    const headers = { 'User-Agent': BROWSER_UA };
    
    // Fetch profile and badges concurrently
    const [profileRes, badgesRes] = await Promise.allSettled([
      axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, { headers }),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers })
    ]);
    
    if (profileRes.status !== 'fulfilled') return null;
    const model = profileRes.value.data.model;
    
    const badges = [];
    
    // 1. Level badge (overall)
    if (model.level >= 1) {
      badges.push({ 
        id: 'hr-lvl', 
        name: `Level ${model.level} Hacker`, 
        icon: '⭐', 
        stars: Math.min(model.level, 5), 
        color: '#10b981', 
        type: 'real' 
      });
    }

    // 2. Domain badges (Problem Solving, C++, etc)
    if (badgesRes.status === 'fulfilled' && badgesRes.value.data?.models) {
      const badgeColors = ['#94a3b8', '#cd7f32', '#94a3b8', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6'];
      badgesRes.value.data.models.forEach(b => {
        if (b.stars > 0) {
          badges.push({
            id: `hr-${b.badge_type}`,
            name: b.badge_name,
            icon: '🏅',
            stars: b.stars,
            color: badgeColors[Math.min(b.stars, 6)] || '#10b981',
            type: 'real'
          });
        }
      });
    }

    return { 
      name: model.name, 
      level: model.level, 
      followers: model.followers_count || 0, 
      badgesCount: badges.length, 
      url: `https://www.hackerrank.com/profile/${username}`, 
      badges 
    };
  } catch (error) {
    console.warn(`HackerRank fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

const fetchGFGStats = async (username) => {
  if (!username) return null;
  try {
    const htmlRes = await axios.get(`https://www.geeksforgeeks.org/user/${username}/`, { headers: { 'User-Agent': BROWSER_UA } });
    const html = htmlRes.data;
    
    const scoreMatch = html.match(/score\\":(\d+)/i) || html.match(/overall_coding_score.*?(\d+)/i);
    const solvedMatch = html.match(/total_problems_solved\\":(\d+)/i) || html.match(/solved_problems.*?(\d+)/i);
    const codingScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const problemsSolved = solvedMatch ? parseInt(solvedMatch[1], 10) : 0;

    const badges = [];

    if (!codingScore && !problemsSolved) throw new Error('Stats not found');
    return { codingScore, problemsSolved, currentStreak: 0, instituteRank: null, url: `https://www.geeksforgeeks.org/user/${username}/`, badges };
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
    const contestCount = ratingRes.status==='fulfilled' && Array.isArray(ratingRes.value?.data?.result) ? ratingRes.value.data.result.length : 0;
    return { rating, maxRating, rank, maxRank, contestCount, url: `https://codeforces.com/profile/${username}`, badges };
  } catch (error) {
    console.warn(`Codeforces fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

const fetchDuolingoStats = async (username) => {
  if (!username) return null;
  try {
    const response = await axios.get(`https://www.duolingo.com/2017-06-30/users?username=${username}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.data || !response.data.users || response.data.users.length === 0) return null;
    
    const user = response.data.users[0];
    const totalXp = user.totalXp || 0;
    const streak = user.streak || 0;
    const courses = user.courses || [];
    
    // Create badges for active courses
    const activeCourses = courses.filter(c => c.xp > 0).sort((a, b) => b.xp - a.xp).slice(0, 3);
    const badges = activeCourses.map(course => ({
      id: `duo-lang-${course.id}`,
      name: course.title,
      icon: '🌍',
      color: '#58cc02',
      type: 'language'
    }));

    return { 
      totalXp, 
      streak, 
      courses, 
      url: `https://www.duolingo.com/profile/${username}`,
      badges
    };
  } catch (error) {
    console.warn(`Duolingo fetch failed for ${username}: ${error.message}`);
    return null;
  }
};

module.exports = { fetchGitHubStats, fetchLeetCodeStats, fetchHackerRankStats, fetchGFGStats, fetchCodechefStats, fetchCodeforcesStats, fetchDuolingoStats };
