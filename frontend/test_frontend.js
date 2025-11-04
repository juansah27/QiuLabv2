// Test script untuk frontend
console.log('🧪 Testing Frontend API Access');

// Test 1: Check if we can make a fetch request
async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('/api/dashboard/setup-request-analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Data received:', data);
      console.log('Total Request Client:', data.totalRequestClient);
      console.log('Top Client Request:', data.topClientRequest);
      console.log('Gift Type 2:', data.giftType2Count);
      console.log('Gift Type 3:', data.giftType3Count);
      console.log('Total Setup:', data.totalSetup);
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test 2: Check localStorage
function testLocalStorage() {
  console.log('\nTesting localStorage...');
  const token = localStorage.getItem('token');
  console.log('Token available:', !!token);
  if (token) {
    console.log('Token length:', token.length);
  }
}

// Run tests
testLocalStorage();
testAPI();

