const axios = require('axios');

async function testInsights() {
  try {
    const response = await axios.get('http://localhost:3000/clients/15/tiktok/insights');
    console.log('--- TEST SUCCESS ---');
    console.log('User Stats:', response.data.user ? 'Found' : 'Missing');
    console.log('Videos Count:', response.data.videos?.length || 0);
  } catch (error) {
    console.log('--- TEST FAILED ---');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testInsights();
