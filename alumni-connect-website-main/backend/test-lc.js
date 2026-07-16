const axios = require('axios');
async function getLC() {
  try {
    const res = await axios.post('https://leetcode.com/graphql', {
      query: `query userProfileCalendar($username: String!) { matchedUser(username: $username) { userCalendar { submissionCalendar } } }`,
      variables: { username: 'Sriman_Kumar_V' }
    });
    console.log('LC Data:', res.data.data.matchedUser.userCalendar.submissionCalendar);
  } catch (e) {
    console.error('LC fail:', e.message);
  }
}
getLC();
