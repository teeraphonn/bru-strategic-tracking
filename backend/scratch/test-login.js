async function test(url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin1234'
      })
    });
    console.log(`URL ${url} - Status:`, response.status);
    const data = await response.json();
    console.log('Login result:', data);
  } catch (error) {
    console.error(`URL ${url} failed! Error:`, error.message);
  }
}

async function run() {
  await test('http://127.0.0.1:5000/api/auth/login');
  await test('http://[::1]:5000/api/auth/login');
}

run();
