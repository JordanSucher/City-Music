const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');

let auth;
let chromeProcess = null;

// Bright Data Proxy Configuration
const PROXY_CONFIG = {
  host: process.env.BRIGHTDATA_HOST || 'brd-customer-hl_xxxxx-zone-residential:brd-customer-hl_xxxxx-zone-residential-session-rand12345',
  port: process.env.BRIGHTDATA_PORT || '22225',
  username: process.env.BRIGHTDATA_USER || 'brd-customer-hl_xxxxx-zone-residential',
  password: process.env.BRIGHTDATA_PASS || 'your_password_here'
};

// Chrome args with proxy configuration
const getProxyChromeArgs = () => {
  const proxyString = `${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`;

  return [
    // Core security
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',

    // SSL/TLS fixes for proxy
    '--ignore-ssl-errors',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-ssl-version-fallback-min',
    '--allow-running-insecure-content',
    '--disable-certificate-transparency',

    // PROXY CONFIGURATION - CRITICAL
    `--proxy-server=http://${proxyString}`,
    '--proxy-bypass-list=127.0.0.1,localhost',

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

    // Network optimizations for proxy
    '--aggressive-cache-discard',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',

    // Server environment
    '--headless=new',
    '--remote-debugging-address=0.0.0.0',
    '--remote-debugging-port=9222',
    '--window-size=1920,1080',
    '--user-data-dir=/tmp/chrome-proxy'
  ];
};

// Residential IP stealth injection
const residentialStealthInjection = async (page) => {
  console.log('🏠 Applying residential proxy stealth...');

  // Set proxy authentication
  await page.authenticate({
    username: PROXY_CONFIG.username,
    password: PROXY_CONFIG.password
  });

  await page.evaluateOnNewDocument(() => {
    // Remove all automation indicators
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true
    });

    // Residential-like navigator properties
    const navigatorSpoof = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      platform: 'Win32', // Residential users often use Windows
      hardwareConcurrency: 8,
      deviceMemory: 8,
      maxTouchPoints: 0,
      cookieEnabled: true,
      doNotTrack: null,
      onLine: true
    };

    Object.keys(navigatorSpoof).forEach(key => {
      Object.defineProperty(navigator, key, {
        get: () => navigatorSpoof[key],
        configurable: true
      });
    });

    // Chrome object (residential users have full Chrome)
    if (!window.chrome) {
      window.chrome = {};
    }
    window.chrome.runtime = {
      onConnect: null,
      onMessage: null,
      id: undefined
    };

    // Screen properties for residential desktop
    Object.defineProperties(screen, {
      width: { get: () => 1920, configurable: true },
      height: { get: () => 1080, configurable: true },
      availWidth: { get: () => 1920, configurable: true },
      availHeight: { get: () => 1040, configurable: true },
      colorDepth: { get: () => 24, configurable: true },
      pixelDepth: { get: () => 24, configurable: true }
    });

    // Timezone for residential US location
    const originalDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(...args) {
      if (!args[1] || !args[1].timeZone) {
        // Use various US timezones to match residential proxy locations
        const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
        const randomTz = timezones[Math.floor(Math.random() * timezones.length)];
        args[1] = { ...args[1], timeZone: randomTz };
      }
      return new originalDateTimeFormat(...args);
    };

    // WebRTC leak protection (important with proxies)
    const originalCreateOffer = RTCPeerConnection.prototype.createOffer;
    RTCPeerConnection.prototype.createOffer = function(...args) {
      const options = args[0] || {};
      options.offerToReceiveAudio = false;
      options.offerToReceiveVideo = false;
      return originalCreateOffer.apply(this, [options, ...args.slice(1)]);
    };
  });

  // Residential user headers
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"', // Match the Windows user agent
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

// Optimized bypass for residential proxy
const proxyOptimizedBypass = async (page) => {
  console.log('🌐 Residential proxy Cloudflare bypass...');

  let attempts = 0;
  const maxAttempts = 60; // Residential IPs should be faster
  let challengeStartTime = Date.now();

  while (attempts < maxAttempts) {
    const pageInfo = await page.evaluate(() => {
      const title = document.title;
      const bodyText = document.body ? document.body.innerText : '';
      const elementCount = document.querySelectorAll('*').length;

      // Check for challenges
      const hasChallenge = bodyText.includes('Just a moment') ||
                          bodyText.includes('Verifying you are human') ||
                          bodyText.includes('Checking your browser') ||
                          title.includes('Just a moment');

      // Check for real content
      const hasRealContent = elementCount > 200 &&
                           !hasChallenge &&
                           (bodyText.toLowerCase().includes('shows') ||
                            bodyText.toLowerCase().includes('concerts') ||
                            bodyText.toLowerCase().includes('events'));

      return {
        title,
        bodyText: bodyText.substring(0, 200),
        elementCount,
        hasChallenge,
        hasRealContent,
        url: window.location.href
      };
    });

    const elapsed = Math.floor((Date.now() - challengeStartTime) / 1000);
    console.log(`🏠 Proxy Attempt ${attempts + 1}/${maxAttempts} (${elapsed}s): ${pageInfo.title} (${pageInfo.elementCount} elements)`);

    // Success!
    if (!pageInfo.hasChallenge && pageInfo.hasRealContent) {
      console.log('🎉 RESIDENTIAL PROXY SUCCESS! Cloudflare bypassed!');
      console.log(`⚡ Bypassed in ${elapsed} seconds via residential IP`);
      return true;
    }

    // Challenge detected
    if (pageInfo.hasChallenge) {
      console.log('🔄 Residential IP handling challenge...');

      // Residential IPs usually pass challenges faster
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh occasionally for residential IPs
      if (attempts > 0 && attempts % 10 === 0) {
        console.log('🔄 Refreshing with new residential session...');
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Faster attempts with residential
  }

  console.log('❌ Residential proxy timeout');
  return false;
};

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('🏠 Launching Bright Data Residential Proxy System...');
    console.log(`🌐 Proxy: ${PROXY_CONFIG.host}:${PROXY_CONFIG.port}`);

    const chromeArgs = getProxyChromeArgs();
    console.log('🔧 Chrome proxy args applied');

    chromeProcess = spawn('/usr/bin/google-chrome-stable', chromeArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await new Promise(resolve => setTimeout(resolve, 7000)); // Extra time for proxy

    console.log('🔗 Connecting to Chrome through proxy...');

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
      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
    });

    const browser = await puppeteerCore.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null
    });

    const page = await browser.newPage();

    await residentialStealthInjection(page);

    // Request interception
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('shows') || url.includes('.json')) {
        console.log('📡 API Request via proxy:', url);
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

    // Test proxy connection first
    console.log('🧪 Testing proxy connection...');
    try {
      await page.goto('https://httpbin.org/ip', { timeout: 15000 });
      const ip = await page.evaluate(() => document.body.innerText);
      console.log('🌐 Proxy IP confirmed:', JSON.parse(ip).origin);
    } catch (e) {
      console.log('⚠️  Could not verify proxy IP, continuing...');
    }

    console.log('🎯 Navigating to target via residential proxy...');
    await page.goto('https://www.ohmyrockness.com/shows?all=true', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const bypassSuccess = await proxyOptimizedBypass(page);

    if (bypassSuccess || auth) {
      console.log('🔍 Extracting token data...');

      if (!auth) {
        // Quick interactions to trigger API calls
        try {
          await page.evaluate(() => window.scrollTo(0, 500));
          await new Promise(resolve => setTimeout(resolve, 2000));

          const links = await page.$$('a');
          if (links.length > 0) {
            await links[0].click();
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (e) {
          console.log('Interaction error:', e.message);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('🔐 Final auth token:', auth || 'Not found');

    // Make API call
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

        console.log('📊 API response via proxy:', apiResponse.success ? `Got ${apiResponse.data.length} shows` : `Error: ${apiResponse.error}`);
      } catch (error) {
        console.log('❌ API call failed:', error.message);
      }
    }

    await browser.disconnect();
    if (chromeProcess) chromeProcess.kill();
    return { token: auth, apiData: apiResponse };

  } catch (error) {
    console.log('💥 Proxy system error:', error.message);
    if (chromeProcess) chromeProcess.kill();
    return null;
  }
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Proxy result:', result);
  })();
}

module.exports = getOmrToken;