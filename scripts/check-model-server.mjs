// Simple script to check if model server is running
import http from 'http';

const HOST = 'localhost';
const PORT = 8000; // منفذ FastAPI الافتراضي
const PATH = '/static'; // مسار الملفات الثابتة في FastAPI

const options = {
  hostname: HOST,
  port: PORT,
  path: PATH,
  method: 'GET',
  timeout: 3000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200 || res.statusCode === 404) {
    console.log('Model server is running (static endpoint responded).');
    process.exit(0);
  } else {
    console.error(`Model server responded with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('Model server is not running:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Model server check timed out.');
  req.destroy();
  process.exit(1);
});

req.end();
