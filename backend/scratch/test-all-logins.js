async function test(username, password) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    console.log(`User: ${username} - Status: ${response.status} - Result:`, response.status === 200 ? 'Success' : data.message);
  } catch (error) {
    console.error(`User: ${username} failed! Error:`, error.message);
  }
}

async function run() {
  await test('admin', 'admin1234');
  await test('president', '123456');
  await test('dean', '123456');
  await test('teacher', '123456');
  await test('teacher2', '123456');
}

run();
