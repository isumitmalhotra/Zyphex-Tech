// Test what API is returning
async function testContentAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/content?keys=hero,about,services-intro,why-choose-us,cta');
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    console.log('Type of data:', typeof data);
    console.log('Keys:', Object.keys(data));
    if (data.data) {
      console.log('data.data keys:', Object.keys(data.data));
      console.log('Hero content:', data.data.hero);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testContentAPI();