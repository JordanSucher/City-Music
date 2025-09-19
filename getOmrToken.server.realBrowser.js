const puppeteer = require('puppeteer-core');

let auth;

// Bright Data Browser API configuration
const BROWSER_API_CONFIG = {
  // Construct WebSocket endpoint from environment variables
  wsEndpoint: process.env.BRIGHTDATA_BROWSER_WS ||
    `wss://${process.env.BRIGHTDATA_USER}@${process.env.BRIGHTDATA_HOST}:9222`
};

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('🚀 Connecting puppeteer-core to Bright Data Browser API...');
    console.log(`🌐 WebSocket Endpoint: ${BROWSER_API_CONFIG.wsEndpoint.replace(/:[^:@]*@/, ':***@')}`); // Hide password in logs

    // Connect puppeteer directly to Bright Data Browser WebSocket endpoint
    const browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_API_CONFIG.wsEndpoint,
      defaultViewport: { width: 1920, height: 1080 }
    });

    console.log('✅ Connected to Bright Data Browser API successfully');

    const page = await browser.newPage();

    // Set user agent for better stealth
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set up request interception to capture auth tokens
    await page.setRequestInterception(true);

    page.on('request', request => {
      const url = request.url();

      // Look for API requests with broader patterns
      if (url.includes('/api/') ||
          url.includes('ohmyrockness') ||
          url.includes('shows') ||
          url.includes('graphql') ||
          url.includes('.json')) {
        console.log('📡 API Request captured:', url);

        const headers = request.headers();
        const authHeaders = ['authorization', 'x-auth-token', 'x-api-key', 'x-access-token', 'bearer', 'token'];

        authHeaders.forEach(header => {
          if (headers[header]) {
            console.log(`🔑 Found ${header}:`, headers[header]);
            auth = headers[header];
          }
        });
      }

      request.continue();
    });

    console.log('🎯 Navigating to target page...');

    // Navigate to the target page
    await page.goto('https://www.ohmyrockness.com/shows?all=true', {
      waitUntil: 'networkidle2',
      timeout: 90000
    });

    console.log('✅ Page loaded, checking for Cloudflare challenges...');

    // Wait for any Cloudflare challenges to resolve
    await page.waitForFunction(
      () => {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText : '';

        // Check if we're past Cloudflare challenges
        return !bodyText.includes('Just a moment') &&
               !bodyText.includes('Checking your browser') &&
               !title.includes('Just a moment');
      },
      { timeout: 120000, polling: 2000 }
    );

    console.log('🎉 Cloudflare challenges bypassed!');

    // Wait a bit more for API calls to trigger
    await page.waitForTimeout(5000);

    // Trigger some interactions to ensure API calls are made
    console.log('🔄 Triggering page interactions...');
    try {
      await page.evaluate(() => {
        // Scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(2000);

      // Click on any show links to trigger more API calls
      const showLinks = await page.$$('a[href*="show"]');
      if (showLinks.length > 0) {
        await showLinks[0].click();
        await page.waitForTimeout(3000);
      }
    } catch (interactionError) {
      console.log('⚠️ Interaction error (continuing):', interactionError.message);
    }

    console.log('🔐 Final auth token:', auth || 'Not found');

    // If we have an auth token, try making a direct API call
    let apiResponse = null;
    if (auth) {
      console.log('📡 Testing auth token with API call...');

      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const formatDate = (date) => {
          const month = (date.getMonth() + 1).toString();
          const day = date.getDate().toString();
          const year = date.getFullYear().toString();
          return `${month}-${day}-${year}`;
        };

        const startDate = formatDate(today);
        const endDate = formatDate(nextWeek);
        const apiUrl = `https://www.ohmyrockness.com/api/shows.json?daterange%5Bfrom%5D=${startDate}&daterange%5Buntil%5D=${endDate}&index=true&per=500&regioned=1`;

        apiResponse = await page.evaluate(async (url, token) => {
          try {
            const response = await fetch(url, {
              headers: {
                'Authorization': token,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': window.location.href
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return { success: true, data: data };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }, apiUrl, auth);

        console.log('📊 API response:', apiResponse.success ? `Got ${apiResponse.data.length} shows` : `Error: ${apiResponse.error}`);
      } catch (error) {
        console.log('❌ API call failed:', error.message);
      }
    }

    await browser.close();
    console.log('🧹 Browser closed');

    return { token: auth, apiData: apiResponse };

  } catch (error) {
    console.log('💥 puppeteer-real-browser error:', error.message);
    return null;
  }
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Result:', result);
  })();
}

module.exports = getOmrToken;