const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');

let auth;
let chromeProcess = null;

// Ultimate stealth Chrome configuration
const ultimateChromeArgs = [
  // Core security
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-web-security',

  // Advanced anti-detection
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

  // Network stealth
  '--cipher-suite-blacklist=0x0004,0x0005,0x000a,0x002f,0x0035,0x003c,0x003d,0x0041,0x0067,0x006b',
  '--ssl-version-fallback-min=tls1.2',
  '--disable-features=AsyncDNS',

  // Performance and stability
  '--memory-pressure-off',
  '--max_old_space_size=4096',
  '--js-flags=--max-old-space-size=4096',

  // Server environment
  '--headless=new',
  '--remote-debugging-address=0.0.0.0',
  '--remote-debugging-port=9222',
  '--window-size=1920,1080',
  '--user-data-dir=/tmp/chrome-ultimate'
];

// Ultimate stealth injection
const ultimateStealthInjection = async (page) => {
  console.log('🥷 Applying ultimate stealth techniques...');

  await page.evaluateOnNewDocument(() => {
    // Complete webdriver removal
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true
    });

    // Comprehensive navigator spoofing
    const navigatorSpoof = {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'Linux x86_64',
      hardwareConcurrency: 8,
      deviceMemory: 8,
      maxTouchPoints: 0,
      cookieEnabled: true,
      doNotTrack: null,
      connection: {
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false
      }
    };

    Object.keys(navigatorSpoof).forEach(key => {
      if (key === 'connection') {
        Object.defineProperty(navigator, key, {
          get: () => navigatorSpoof[key],
          configurable: true
        });
      } else {
        Object.defineProperty(navigator, key, {
          get: () => navigatorSpoof[key],
          configurable: true
        });
      }
    });

    // Chrome runtime spoofing
    if (!window.chrome) {
      window.chrome = {};
    }
    window.chrome.runtime = {
      onConnect: null,
      onMessage: null
    };

    // Screen object spoofing
    Object.defineProperties(screen, {
      width: { get: () => 1920, configurable: true },
      height: { get: () => 1080, configurable: true },
      availWidth: { get: () => 1920, configurable: true },
      availHeight: { get: () => 1040, configurable: true },
      colorDepth: { get: () => 24, configurable: true },
      pixelDepth: { get: () => 24, configurable: true }
    });

    // Advanced Canvas protection
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
      // Add canvas noise for fingerprinting protection
      const context = this.getContext('2d');
      if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (Math.random() < 0.0001) {
            data[i] = Math.min(255, data[i] + (Math.random() - 0.5) * 2);
            data[i + 1] = Math.min(255, data[i + 1] + (Math.random() - 0.5) * 2);
            data[i + 2] = Math.min(255, data[i + 2] + (Math.random() - 0.5) * 2);
          }
        }
        context.putImageData(imageData, 0, 0);
      }
      return originalToDataURL.call(this, type, quality);
    };

    // WebGL advanced spoofing
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      const spoofed = {
        37445: 'Intel Open Source Technology Center', // VENDOR
        37446: 'Mesa DRI Intel(R) UHD Graphics 620 (WHL GT2)', // RENDERER
        34047: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)', // VERSION
        35724: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)', // SHADING_LANGUAGE_VERSION
        7936: 'WebGL', // EXTENSIONS
        7937: 'WebGL Vendor', // VENDOR
        7938: 'WebGL Renderer' // RENDERER
      };
      return spoofed[parameter] || getParameter.call(this, parameter);
    };

    // Mouse and touch event simulation
    let mouseX = Math.floor(Math.random() * 800) + 200;
    let mouseY = Math.floor(Math.random() * 400) + 200;

    const updateMousePosition = () => {
      mouseX += (Math.random() - 0.5) * 20;
      mouseY += (Math.random() - 0.5) * 20;
      mouseX = Math.max(0, Math.min(1920, mouseX));
      mouseY = Math.max(0, Math.min(1080, mouseY));
    };

    // Override mouse position reporting
    document.addEventListener('mousemove', updateMousePosition);

    // Timezone consistency
    const originalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(...args) {
      if (!args[1] || !args[1].timeZone) {
        args[1] = { ...args[1], timeZone: 'America/New_York' };
      }
      return new originalDateTimeFormat(...args);
    };

    // Performance.now() timing attack protection
    const originalNow = Performance.prototype.now;
    let timeOffset = Math.random() * 100;
    Performance.prototype.now = function() {
      return originalNow.call(this) + timeOffset;
    };
  });

  // Set comprehensive headers
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Linux"',
    'Sec-Ch-Ua-Platform-Version': '"6.1.0"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });
};

// Ultimate Cloudflare bypass with timing-based challenge handling
const ultimateCloudflareBypass = async (page) => {
  console.log('🚀 Ultimate Cloudflare bypass initiated...');

  let attempts = 0;
  const maxAttempts = 120; // 10 minutes
  let lastRayId = null;
  let challengeStartTime = Date.now();

  while (attempts < maxAttempts) {
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';
      const elementCount = document.querySelectorAll('*').length;

      // Extract Ray ID
      const rayIdMatch = bodyText.match(/Ray ID: ([a-f0-9]+)/i);
      const rayId = rayIdMatch ? rayIdMatch[1] : null;

      // Comprehensive challenge detection
      const indicators = {
        cloudflare: bodyText.includes('Cloudflare'),
        justMoment: bodyText.includes('Just a moment') || title.includes('Just a moment'),
        verifying: bodyText.includes('Verifying you are human') || bodyText.includes('Verify you are human'),
        checking: bodyText.includes('Checking your browser'),
        pleaseWait: bodyText.includes('Please wait'),
        connection: bodyText.includes('review the security of your connection'),
        performance: bodyText.includes('Performance & security'),
        turnstile: !!document.querySelector('iframe[src*="turnstile"], iframe[src*="challenges.cloudflare.com"], .cf-turnstile, [data-sitekey]')
      };

      const hasChallenge = Object.values(indicators).some(Boolean);

      // Real content detection
      const contentIndicators = {
        shows: bodyText.toLowerCase().includes('shows'),
        concerts: bodyText.toLowerCase().includes('concerts'),
        events: bodyText.toLowerCase().includes('events'),
        venue: bodyText.toLowerCase().includes('venue'),
        tickets: bodyText.toLowerCase().includes('tickets')
      };

      const hasRealContent = elementCount > 200 &&
                           !hasChallenge &&
                           Object.values(contentIndicators).some(Boolean);

      return {
        title,
        bodyText: bodyText.substring(0, 300),
        elementCount,
        rayId,
        hasChallenge,
        hasRealContent,
        indicators,
        url: window.location.href,
        timestamp: Date.now()
      };
    });

    const elapsed = Math.floor((Date.now() - challengeStartTime) / 1000);
    console.log(`⏱️  Attempt ${attempts + 1}/${maxAttempts} (${elapsed}s): ${pageInfo.title} (${pageInfo.elementCount} elements)`);

    if (pageInfo.rayId && pageInfo.rayId !== lastRayId) {
      console.log(`🆔 New Ray ID: ${pageInfo.rayId}`);
      lastRayId = pageInfo.rayId;
      challengeStartTime = Date.now(); // Reset timer for new challenge
    }

    // Success condition
    if (!pageInfo.hasChallenge && pageInfo.hasRealContent) {
      console.log('✅ SUCCESS! Cloudflare bypassed - real content loaded!');
      console.log(`🎉 Challenge completed in ${elapsed} seconds`);
      return true;
    }

    // Challenge handling
    if (pageInfo.hasChallenge) {
      console.log('🔍 Cloudflare challenge active...');

      // Detect challenge type
      if (pageInfo.indicators.verifying && !pageInfo.indicators.justMoment) {
        console.log('⚡ Timing-based challenge detected - waiting patiently...');
        // For timing challenges, wait longer and be more patient
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else if (pageInfo.indicators.turnstile) {
        console.log('🎯 Turnstile challenge detected - attempting interaction...');

        // Advanced Turnstile handling
        await page.evaluate(() => {
          // Look for Turnstile iframes and interact
          const turnstileSelectors = [
            'iframe[src*="turnstile"]',
            'iframe[src*="challenges.cloudflare.com"]',
            '.cf-turnstile',
            '[data-sitekey]'
          ];

          turnstileSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              try {
                // Simulate human-like interaction
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  element.click();
                  element.focus();

                  // Dispatch comprehensive events
                  ['mouseenter', 'mousedown', 'mouseup', 'click', 'focus'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true, cancelable: true });
                    element.dispatchEvent(event);
                  });
                }
              } catch (e) {
                console.log(`Interaction failed: ${e.message}`);
              }
            });
          });
        });

        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('🕐 Standard challenge - waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Refresh strategy for stuck challenges
      if (attempts > 0 && attempts % 15 === 0) {
        console.log('🔄 Challenge seems stuck - refreshing page...');
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        challengeStartTime = Date.now();
      }
    }

    attempts++;

    // Progressive wait times (start fast, slow down)
    const waitTime = Math.min(5000 + (attempts * 100), 10000);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Add randomness
    if (Math.random() < 0.2) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000));
    }
  }

  console.log('❌ Ultimate bypass timeout - challenge not resolved');
  return false;
};

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('🚀 Launching Ultimate Cloudflare Bypass System...');

    chromeProcess = spawn('/usr/bin/google-chrome-stable', ultimateChromeArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔗 Establishing Chrome connection...');

    const http = require('http');
    const wsEndpoint = await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            resolve(info.webSocketDebuggerUrl);
          } catch (e) {
            reject(new Error('Failed to parse Chrome info'));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
    });

    const browser = await puppeteerCore.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null
    });

    const page = await browser.newPage();

    await ultimateStealthInjection(page);

    // Request interception
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('shows') || url.includes('.json')) {
        console.log('📡 API Request:', url);
        const headers = request.headers();
        ['authorization', 'x-auth-token', 'x-api-key', 'x-access-token', 'bearer', 'token'].forEach(header => {
          if (headers[header]) {
            console.log(`🔑 Found ${header}:`, headers[header]);
            auth = headers[header];
          }
        });
      }
      request.continue();
    });

    console.log('🌐 Navigating to target with ultimate stealth...');
    await page.goto('https://www.ohmyrockness.com/shows?all=true', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    const bypassSuccess = await ultimateCloudflareBypass(page);

    if (bypassSuccess) {
      console.log('🎯 Proceeding with token extraction...');

      // Enhanced token extraction
      if (!auth) {
        console.log('🔍 Searching for auth token...');

        // Scroll and interact to trigger API calls
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await new Promise(resolve => setTimeout(resolve, 3000));

        const links = await page.$$('a');
        if (links.length > 0) {
          try {
            await links[Math.floor(Math.random() * Math.min(5, links.length))].click();
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (e) {
            console.log('Click interaction failed:', e.message);
          }
        }

        if (!auth) {
          await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Final wait for API calls
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('⚠️  Bypass incomplete, attempting token extraction anyway...');
    }

    console.log('🔐 Final auth token:', auth || 'Not found');

    // API call if token available
    let apiResponse = null;
    if (auth) {
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
                'Accept': 'application/json'
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

    await browser.disconnect();
    if (chromeProcess) chromeProcess.kill();
    return { token: auth, apiData: apiResponse };

  } catch (error) {
    console.log('💥 System error:', error.message);
    if (chromeProcess) chromeProcess.kill();
    return null;
  }
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Final result:', result);
  })();
}

module.exports = getOmrToken;