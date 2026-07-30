const { fetchLeetCodeStats } = require('./utils/devStatsFetcher');
const axios = require('axios');
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function test() {
  const username = 'srimankumar'; 
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
    try {
      const response = await axios.post('https://leetcode.com/graphql', { query, variables: { username } }, {
        headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': BROWSER_UA }
      });
      console.log(response.data);
    } catch(e) {
      console.error(e.response ? e.response.data : e.message);
    }
}
test();
