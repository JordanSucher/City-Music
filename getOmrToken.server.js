const { connect } = require("puppeteer-real-browser");

let auth;

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('Launching headless browser optimized for server environment...');

    const { browser, page } = await connect({
      headless: "new", // Use new headless mode for better Docker compatibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--no-first-run',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--remote-debugging-address=0.0.0.0', // Critical: bind to all interfaces
        '--remote-debugging-port=9222',
        '--window-size=1366,768',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-zygote', // Important for Docker
        '--single-process', // May help with connection issues
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      turnstile: true,
      fingerprint: true,
      connectOption: {
        defaultViewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      disableXvfb: false, // Keep Xvfb enabled for Docker
      ignoreAllFlags: false,
      executablePath: '/usr/bin/google-chrome-stable' // Explicit path
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
      timeout: 60000 // Increased timeout for slower server connections
    });

    console.log('Page loaded, checking for Cloudflare challenge...');

    // Wait for initial load - longer on servers
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Check if we're facing a Cloudflare challenge
    let attempts = 0;
    const maxAttempts = 36; // 3 minutes with 5-second intervals (servers can be slower)

    while (attempts < maxAttempts) {
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body ? document.body.innerText.substring(0, 500) : 'No body',
          hasCloudflareText: document.body && (
            document.body.innerText.includes('Cloudflare') ||
            document.body.innerText.includes('Just a moment') ||
            document.body.innerText.includes('Verifying you are human') ||
            document.body.innerText.includes('Checking your browser') ||
            document.body.innerText.includes('Please wait')
          ),
          hasRealContent: document.querySelectorAll('*').length > 100 &&
                         (!document.body || !document.body.innerText.includes('Just a moment')),
          elementCount: document.querySelectorAll('*').length
        };
      });

      console.log(`Attempt ${attempts + 1}/${maxAttempts}: ${pageInfo.title} (${pageInfo.elementCount} elements)`);

      if (!pageInfo.hasCloudflareText && pageInfo.hasRealContent) {
        console.log('Successfully bypassed Cloudflare! Real content loaded.');
        break;
      }

      if (pageInfo.hasCloudflareText) {
        console.log('Cloudflare challenge detected. Waiting for automatic bypass...');
        console.log('Challenge text:', pageInfo.bodyText.substring(0, 200));

        // More aggressive CAPTCHA interaction for servers
        try {
          const captchaResult = await page.evaluate(() => {
            // Try to find and interact with Cloudflare challenge elements
            const selectors = [
              'input[type="checkbox"]',
              '.cf-turnstile',
              'iframe[src*="challenges.cloudflare.com"]',
              'iframe[src*="turnstile"]',
              'button[type="submit"]',
              '.cf-challenge-submit',
              '#challenge-form input[type="submit"]',
              '.challenge-form button'
            ];

            let results = [];
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                results.push(`Found ${selector}: ${elements.length} elements`);
                try {
                  // Try clicking all matching elements
                  elements.forEach((el, idx) => {
                    try {
                      el.click();
                      results.push(`clicked ${selector}[${idx}]`);
                    } catch (e) {
                      results.push(`couldn't click ${selector}[${idx}]: ${e.message}`);
                    }
                  });
                } catch (e) {
                  results.push(`error with ${selector}: ${e.message}`);
                }
              }
            }

            // Also try to trigger any form submissions
            const forms = document.querySelectorAll('form');
            forms.forEach((form, idx) => {
              try {
                if (form.id && (form.id.includes('challenge') || form.id.includes('cf'))) {
                  form.submit();
                  results.push(`submitted form[${idx}] with id: ${form.id}`);
                }
              } catch (e) {
                results.push(`couldn't submit form[${idx}]: ${e.message}`);
              }
            });

            return results.length > 0 ? results.join('; ') : 'no captcha elements found';
          });

          if (captchaResult !== 'no captcha elements found') {
            console.log('CAPTCHA interaction results:', captchaResult);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer after interaction
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

      // Log final page state for debugging
      try {
        const finalState = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodySnippet: document.body ? document.body.innerText.substring(0, 1000) : 'No body',
            hasCloudflareText: document.body && document.body.innerText.includes('Cloudflare')
          };
        });
        console.log('Final page state:', JSON.stringify(finalState, null, 2));
      } catch (e) {
        console.log('Could not get final page state:', e.message);
      }
    }

    console.log('Proceeding with token extraction...');

    if (!auth) {
      console.log('No auth token found yet, trying interactions...');

      // More extensive interaction sequence for servers
      try {
        // Multiple scroll attempts
        for (let i = 0; i < 3; i++) {
          await page.evaluate((scrollStep) => {
            window.scrollTo(0, document.body.scrollHeight * scrollStep / 3);
          }, i + 1);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Try clicking on multiple types of elements
        const selectors = ['button', 'a', '[role="button"]', '.show', '.event', '.list-item', 'nav a'];

        for (const selector of selectors) {
          try {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              console.log(`Trying to click ${selector} elements (found ${elements.length})...`);
              // Click first few elements of each type
              for (let i = 0; i < Math.min(3, elements.length); i++) {
                try {
                  await elements[i].click();
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  if (auth) break; // Stop if we got a token
                } catch (e) {
                  console.log(`Click failed on ${selector}[${i}]:`, e.message);
                }
              }
            }
            if (auth) break; // Stop if we got a token
          } catch (e) {
            console.log(`Error with selector ${selector}:`, e.message);
          }
        }

        // Try a page refresh if still no token
        if (!auth) {
          console.log('Still no token, refreshing page...');
          await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      } catch (e) {
        console.log('Error during interaction sequence:', e.message);
      }
    }

    // Final wait for any delayed API calls
    await new Promise(resolve => setTimeout(resolve, 8000));

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
    console.error('Full error:', error);
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