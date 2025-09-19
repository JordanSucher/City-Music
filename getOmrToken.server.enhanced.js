const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');

let auth;
let chromeProcess = null;

// Advanced Cloudflare bypass techniques
const enhancedChromeArgs = [
  // Core security
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',

  // Advanced fingerprinting protection
  '--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess,OutOfBlinkCors',
  '--disable-blink-features=AutomationControlled,WebRTC',
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-component-extensions-with-background-pages',
  '--no-default-browser-check',
  '--no-first-run',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-field-trial-config',
  '--disable-hang-monitor',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--disable-translate',
  '--metrics-recording-only',
  '--safebrowsing-disable-auto-update',
  '--password-store=basic',
  '--use-mock-keychain',

  // TLS/Network fingerprinting bypass
  '--cipher-suite-blacklist=0x0004,0x0005,0x000a,0x002f,0x0035,0x003c,0x003d,0x0041,0x0067,0x006b',
  '--ssl-version-fallback-min=tls1.2',
  '--tls13-variant=draft',
  '--disable-features=AsyncDNS',

  // Canvas/WebGL protection
  '--disable-gl-drawing-for-tests',
  '--disable-canvas-aa',
  '--disable-accelerated-2d-canvas',
  '--num-raster-threads=1',

  // Audio fingerprinting protection
  '--disable-audio-output',
  '--mute-audio',

  // Memory and performance
  '--memory-pressure-off',
  '--max_old_space_size=4096',
  '--js-flags=--max-old-space-size=4096',

  // Server environment specific
  '--headless=new',
  '--remote-debugging-address=0.0.0.0',
  '--remote-debugging-port=9222',
  '--window-size=1366,768',
  '--user-data-dir=/tmp/chrome-user-data-enhanced'
];

// Enhanced stealth techniques
const enhanceStealth = async (page) => {
  console.log('Applying advanced stealth techniques...');

  // 1. Override navigator properties
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Spoof languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Spoof platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Linux x86_64',
    });

    // Spoof hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 4,
    });

    // Spoof device memory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // Remove automation indicators
    delete window.chrome.runtime;
    window.chrome = {
      runtime: {},
    };

    // Spoof permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Canvas fingerprinting protection
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type) {
      const context = getContext.apply(this, arguments);
      if (type === '2d') {
        const originalGetImageData = context.getImageData;
        context.getImageData = function(...args) {
          const imageData = originalGetImageData.apply(this, args);
          // Add subtle noise to prevent fingerprinting
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < 0.001) {
              data[i] = Math.min(255, data[i] + Math.floor(Math.random() * 3) - 1);
              data[i + 1] = Math.min(255, data[i + 1] + Math.floor(Math.random() * 3) - 1);
              data[i + 2] = Math.min(255, data[i + 2] + Math.floor(Math.random() * 3) - 1);
            }
          }
          return imageData;
        };
      }
      return context;
    };

    // WebGL fingerprinting protection
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Open Source Technology Center';
      }
      if (parameter === 37446) {
        return 'Mesa DRI Intel(R) HD Graphics 620 (Kaby Lake GT2)';
      }
      return getParameter(parameter);
    };

    // Audio context fingerprinting protection
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function(...args) {
        const originalChannelData = originalGetChannelData.apply(this, args);
        // Add noise to audio fingerprinting
        for (let i = 0; i < originalChannelData.length; i += 100) {
          originalChannelData[i] = originalChannelData[i] + Math.random() * 0.0001 - 0.00005;
        }
        return originalChannelData;
      };
    }

    // Font fingerprinting protection
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      get: function() {
        const width = originalOffsetWidth.get.call(this);
        return width + Math.floor(Math.random() * 2);
      }
    });

    // Timezone consistency
    const originalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(...args) {
      if (args.length === 0) {
        args = ['en-US', { timeZone: 'America/New_York' }];
      }
      return new originalDateTimeFormat(...args);
    };
  });

  // 2. Set realistic headers
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  // 3. Set viewport to common resolution
  await page.setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });
};

// Enhanced challenge detection and bypass
const enhancedCloudflareBypass = async (page) => {
  console.log('Enhanced Cloudflare challenge detection...');

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals

  while (attempts < maxAttempts) {
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText.substring(0, 500) : 'No body';
      const elementCount = document.querySelectorAll('*').length;

      // Check for various Cloudflare indicators
      const hasCloudflareText = bodyText.includes('Cloudflare') ||
                               bodyText.includes('Just a moment') ||
                               bodyText.includes('Verifying you are human') ||
                               bodyText.includes('Checking your browser') ||
                               bodyText.includes('Please wait') ||
                               title.includes('Just a moment');

      // Check for Turnstile challenge
      const turnstileFrame = document.querySelector('iframe[src*="turnstile"], iframe[src*="challenges.cloudflare.com"]');
      const turnstileDiv = document.querySelector('div[data-sitekey], .cf-turnstile');
      const challengeForm = document.querySelector('#challenge-form, .challenge-form');

      // Check for real content indicators
      const hasRealContent = elementCount > 100 &&
                            !hasCloudflareText &&
                            (bodyText.includes('shows') || bodyText.includes('concerts') || bodyText.includes('events'));

      return {
        title,
        bodyText: bodyText.substring(0, 200),
        elementCount,
        hasCloudflareText,
        hasTurnstile: !!(turnstileFrame || turnstileDiv),
        hasChallenge: !!challengeForm,
        hasRealContent,
        url: window.location.href
      };
    });

    console.log(`Attempt ${attempts + 1}/${maxAttempts}: ${pageInfo.title} (${pageInfo.elementCount} elements)`);

    // Success - real content loaded
    if (!pageInfo.hasCloudflareText && pageInfo.hasRealContent) {
      console.log('✅ Successfully bypassed Cloudflare! Real content loaded.');
      return true;
    }

    // Handle Cloudflare challenge
    if (pageInfo.hasCloudflareText || pageInfo.hasTurnstile || pageInfo.hasChallenge) {
      console.log('🔍 Cloudflare challenge detected, attempting enhanced bypass...');
      console.log('Challenge info:', pageInfo.bodyText);

      // Advanced challenge interaction
      const interactionResults = await page.evaluate(() => {
        const results = [];

        // Look for various challenge elements
        const selectors = [
          // Turnstile
          'iframe[src*="turnstile"]',
          'iframe[src*="challenges.cloudflare.com"]',
          '.cf-turnstile',
          '[data-sitekey]',

          // Classic challenges
          'input[type="checkbox"]',
          'button[type="submit"]',
          '.cf-challenge-submit',
          '#challenge-form input[type="submit"]',
          '.challenge-form button',
          'input[value="Verify"]',

          // Hidden elements that might need clicking
          '.cf-challenge-running',
          '.cf-challenge-verify',
          '.cf-challenge-response'
        ];

        let foundElements = 0;
        for (const selector of selectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              foundElements += elements.length;
              results.push(`Found ${selector}: ${elements.length} elements`);

              // Try to interact with each element
              elements.forEach((el, idx) => {
                try {
                  // Check if element is visible and clickable
                  const rect = el.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                    // Try different interaction methods
                    el.click();
                    el.focus();

                    // Dispatch mouse events
                    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                      const event = new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                      });
                      el.dispatchEvent(event);
                    });

                    results.push(`Interacted with ${selector}[${idx}]`);
                  }
                } catch (e) {
                  results.push(`Failed to interact with ${selector}[${idx}]: ${e.message}`);
                }
              });
            }
          } catch (e) {
            results.push(`Error with selector ${selector}: ${e.message}`);
          }
        }

        // Try form submissions
        const forms = document.querySelectorAll('form');
        forms.forEach((form, idx) => {
          try {
            if (form.id && (form.id.includes('challenge') || form.id.includes('cf'))) {
              form.submit();
              results.push(`Submitted form[${idx}] with id: ${form.id}`);
            }
          } catch (e) {
            results.push(`Failed to submit form[${idx}]: ${e.message}`);
          }
        });

        return {
          results: results.join('; '),
          foundElements
        };
      });

      console.log(`Challenge interaction results: ${interactionResults.results}`);

      if (interactionResults.foundElements > 0) {
        // Wait longer after successful interaction
        console.log('Waiting for challenge resolution...');
        await new Promise(resolve => setTimeout(resolve, 8000));
      } else {
        // No interactive elements found, try page refresh
        if (attempts % 5 === 4) {
          console.log('Refreshing page to trigger new challenge...');
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    attempts++;

    // Regular wait between attempts
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Add some randomness to avoid pattern detection
    if (Math.random() < 0.3) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    }
  }

  console.log('❌ Cloudflare challenge timeout reached after 5 minutes');
  return false;
};

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('Starting Chrome with enhanced stealth configuration...');

    // Start Chrome with enhanced arguments
    chromeProcess = spawn('/usr/bin/google-chrome-stable', enhancedChromeArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for Chrome to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Getting Chrome WebSocket endpoint...');

    // Get the WebSocket endpoint
    const http = require('http');
    const wsEndpoint = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            console.log('Chrome WebSocket URL:', info.webSocketDebuggerUrl);
            resolve(info.webSocketDebuggerUrl);
          } catch (e) {
            reject(new Error('Failed to parse Chrome info: ' + e.message));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error('Failed to get Chrome WebSocket endpoint: ' + err.message));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout getting Chrome WebSocket endpoint'));
      });
    });

    console.log('Connecting to Chrome with enhanced stealth...');

    // Connect to Chrome
    const browser = await puppeteerCore.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Apply stealth techniques
    await enhanceStealth(page);

    // Set up request interception
    await page.setRequestInterception(true);

    page.on('request', request => {
      const url = request.url();

      // Enhanced API request detection
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

      request.continue();
    });

    console.log('Navigating to site with enhanced Cloudflare bypass...');

    // Navigate with longer timeout
    await page.goto('https://www.ohmyrockness.com/shows?all=true', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Enhanced Cloudflare bypass
    const bypassSuccess = await enhancedCloudflareBypass(page);

    if (!bypassSuccess) {
      console.log('⚠️  Cloudflare bypass incomplete, but continuing with token extraction...');
    }

    // Rest of the token extraction logic (same as before)
    console.log('Proceeding with token extraction...');

    if (!auth) {
      console.log('No auth token found yet, trying enhanced interactions...');

      // Enhanced interaction sequence
      const interactionMethods = [
        // Scroll with realistic patterns
        () => page.evaluate(() => {
          const scrollHeight = document.body.scrollHeight;
          const steps = 5;
          for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
              window.scrollTo({
                top: (scrollHeight * i) / steps,
                behavior: 'smooth'
              });
            }, i * 500);
          }
        }),

        // Click on various elements with realistic timing
        async () => {
          const selectors = ['.show', '.event', 'a', 'button', '[role="button"]', '.list-item'];
          for (const selector of selectors) {
            try {
              const elements = await page.$$(selector);
              if (elements.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(3, elements.length));
                await elements[randomIndex].click();
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                if (auth) break;
              }
            } catch (e) {
              // Ignore click errors
            }
          }
        },

        // Page refresh if still no token
        () => {
          if (!auth) {
            console.log('Refreshing page for additional API calls...');
            return page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
          }
        }
      ];

      for (const method of interactionMethods) {
        await method();
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (auth) break;
      }
    }

    // Final wait for delayed API calls
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Final auth token:', auth || 'Not found');

    // Make API call if we have a token
    let apiResponse = null;
    if (auth) {
      try {
        console.log('Making API call from browser context...');

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

    await browser.disconnect();

    if (chromeProcess) {
      chromeProcess.kill();
    }

    return { token: auth, apiData: apiResponse };

  } catch (error) {
    console.log('Error:', error.message);
    console.error('Full error:', error);

    if (chromeProcess) {
      chromeProcess.kill();
    }

    return null;
  }
};

const getToken = async () => {
  const token = await getOmrToken();
  console.log('Final result:', token);
  return token;
};

if (require.main === module) {
  getToken();
}

module.exports = getOmrToken;