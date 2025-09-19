const { spawn } = require('child_process');
const http = require('http');

console.log('=== Chrome Debug Test ===');

// Test 1: Launch Chrome with debugging port manually
console.log('1. Testing Chrome with manual debugging port...');

const chrome = spawn('/usr/bin/google-chrome-stable', [
  '--headless=new',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--remote-debugging-address=0.0.0.0',
  '--no-first-run',
  '--disable-extensions',
  '--user-data-dir=/tmp/chrome-debug-test'
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

chrome.stdout.on('data', (data) => {
  console.log('Chrome stdout:', data.toString());
});

chrome.stderr.on('data', (data) => {
  console.log('Chrome stderr:', data.toString());
});

// Wait for Chrome to start
setTimeout(() => {
  console.log('2. Testing connection to Chrome debugging port...');

  // Test connection to debugging port
  const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
    console.log('✅ Chrome debugging port is accessible!');
    console.log('Status:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Chrome info:', JSON.parse(data));
      testPuppeteerRealBrowser();
    });
  });

  req.on('error', (err) => {
    console.log('❌ Chrome debugging port NOT accessible:', err.message);

    // Try different approaches
    console.log('3. Testing with localhost instead...');
    const req2 = http.get('http://localhost:9222/json/version', (res) => {
      console.log('✅ Chrome accessible via localhost');
      testPuppeteerRealBrowser();
    }).on('error', (err2) => {
      console.log('❌ Chrome not accessible via localhost either:', err2.message);

      // Check what ports are actually open
      const { execSync } = require('child_process');
      try {
        const netstat = execSync('netstat -tlnp | grep LISTEN').toString();
        console.log('Open ports:', netstat);
      } catch (e) {
        console.log('Could not check open ports');
      }

      testPuppeteerRealBrowser();
    });
  });
}, 3000);

async function testPuppeteerRealBrowser() {
  console.log('4. Testing puppeteer-real-browser...');

  try {
    const { connect } = require("puppeteer-real-browser");

    console.log('Attempting to connect with puppeteer-real-browser...');

    const { browser, page } = await connect({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--remote-debugging-address=0.0.0.0',
        '--remote-debugging-port=9222'
      ],
      executablePath: '/usr/bin/google-chrome-stable',
      disableXvfb: false
    });

    console.log('✅ puppeteer-real-browser connected successfully!');
    await browser.close();

  } catch (error) {
    console.log('❌ puppeteer-real-browser failed:', error.message);
    console.log('Full error:', error);
  }

  // Cleanup
  chrome.kill();
  process.exit(0);
}