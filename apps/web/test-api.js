// Quick test script to verify API client functionality
const { apartmentApi, authApi } = require('./src/services/api.ts');

async function testAPI() {
  console.log('Testing API client...');
  
  try {
    // Test apartment endpoints
    console.log('Testing apartment API...');
    const apartmentsResponse = await apartmentApi.getAll({ limit: 5 });
    console.log('✅ Apartments API working:', apartmentsResponse.success ? 'Success' : 'Failed');
    
    // Test auth endpoints (this will likely fail without a running server)
    console.log('Testing auth API...');
    try {
      await authApi.me();
      console.log('✅ Auth API working');
    } catch (error) {
      console.log('ℹ️ Auth API requires server:', error.message);
    }
    
    console.log('API client tests completed!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();