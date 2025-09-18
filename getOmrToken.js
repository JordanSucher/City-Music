const { connect } = require("puppeteer-real-browser");

let auth;

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('Launching advanced browser with Cloudflare bypass...');

    const { browser, page } = await connect({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--no-first-run'
      ],
      turnstile: true, // Enable automatic Cloudflare Turnstile bypass
      fingerprint: true, // Enable unique fingerprint injection
      connectOption: {
        defaultViewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      disableXvfb: false,
      ignoreAllFlags: false
    });

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
        console.log('>>> API Request:', url);

        const headers = request.headers();
        const authHeaders = ['authorization', 'x-auth-token', 'x-api-key', 'x-access-token', 'bearer', 'token'];

        authHeaders.forEach(header => {
          if (headers[header]) {
            console.log(`>>> Found ${header}:`, headers[header]);
            auth = headers[header];
          }
        });
      }

      // Continue the request
      request.continue();
    });

    console.log('Navigating to site with automatic Turnstile bypass...');
    await page.goto('https://www.ohmyrockness.com/shows?all=true', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Page loaded, checking for Cloudflare challenge...');

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if we're facing a Cloudflare challenge
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 500),
          hasCloudflareText: document.body.innerText.includes('Cloudflare') ||
                            document.body.innerText.includes('Just a moment') ||
                            document.body.innerText.includes('Verifying you are human'),
          hasRealContent: document.querySelectorAll('*').length > 100 &&
                         !document.body.innerText.includes('Just a moment')
        };
      });

      console.log(`Attempt ${attempts + 1}: ${pageInfo.title}`);

      if (!pageInfo.hasCloudflareText && pageInfo.hasRealContent) {
        console.log('Successfully bypassed Cloudflare! Real content loaded.');
        break;
      }

      if (pageInfo.hasCloudflareText) {
        console.log('Cloudflare challenge detected. Please solve manually in the browser or wait for automatic bypass...');
        console.log('Challenge text:', pageInfo.bodyText.substring(0, 200));

        // Look for CAPTCHA elements to interact with
        try {
          const captchaFound = await page.evaluate(() => {
            // Try to find and click Cloudflare challenge elements
            const selectors = [
              'input[type="checkbox"]',
              '.cf-turnstile',
              'iframe[src*="challenges.cloudflare.com"]',
              'iframe[src*="turnstile"]',
              'button[type="submit"]'
            ];

            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                console.log(`Found ${selector}: ${elements.length} elements`);
                try {
                  elements[0].click();
                  return `clicked ${selector}`;
                } catch (e) {
                  return `found but couldn't click ${selector}`;
                }
              }
            }
            return 'no captcha elements found';
          });

          if (captchaFound.includes('clicked')) {
            console.log('Clicked on CAPTCHA element:', captchaFound);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (e) {
          console.log('Error interacting with CAPTCHA:', e.message);
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (attempts >= maxAttempts) {
      console.log('Cloudflare challenge timeout reached. Continuing with current page state...');
    }

    console.log('Proceeding with token extraction...');

    if (!auth) {
      console.log('No auth token found yet, trying interactions...');

      // Try scrolling to trigger lazy-loaded content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await new Promise(resolve => setTimeout(resolve, 3000));

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try clicking on interactive elements
      const clickableElements = await page.$$('button, a, [role="button"], .show, .event');
      if (clickableElements.length > 0) {
        console.log(`Found ${clickableElements.length} clickable elements, trying first one...`);
        try {
          await clickableElements[0].click();
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (e) {
          console.log('Click failed:', e.message);
        }
      }

      // Try a page refresh to trigger more API calls
      if (!auth) {
        console.log('Refreshing page to trigger more API calls...');
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Final wait for any delayed API calls
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Final auth token:', auth || 'Not found');

    // If we have a token, make the API call from within the browser context
    let apiResponse = null;
    if (auth) {
      try {
        console.log('Making API call from browser context...');

        // Calculate date range
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
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data: data };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }, apiUrl, auth);

        console.log('API response:', apiResponse.success ? `Got ${apiResponse.data.length} shows` : `Error: ${apiResponse.error}`);
      } catch (error) {
        console.log('Error making API call:', error.message);
      }
    }

    await browser.close();
    return { token: auth, apiData: apiResponse };

  } catch (error) {
    console.log('Error:', error.message);
    return null;
  }
};

const getToken = async () => {
  const token = await getOmrToken();
  console.log('Final result:', token);
  return token;
};

// Run if called directly
if (require.main === module) {
  getToken();
}

module.exports = getOmrToken;