const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');

/**
 * Residential Proxy + Advanced Cloudflare Bypass
 * Combines proxy rotation with comprehensive fingerprinting evasion
 */

class ProxyEnhancedBypass {
  constructor(options = {}) {
    this.proxyConfig = options.proxy || null;
    this.chromeProcess = null;
    this.auth = null;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.viewport = options.viewport || { width: 1366, height: 768 };
  }

  // Proxy-aware Chrome configuration
  getProxyAwareChromeFlags() {
    const baseFlags = [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',

      // Advanced TLS and network configuration for proxies
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=VizDisplayCompositor,TranslateUI',

      // Proxy-optimized network settings
      '--max-connections-per-host=6',
      '--enable-tcp-fast-open',
      '--enable-quic',
      '--aggressive-cache-discard',
      '--dns-prefetch-disable',

      // Enhanced stealth for proxy environments
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-ipc-flooding-protection',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',

      // Hardware acceleration
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blacklist',

      // Window configuration
      `--window-size=${this.viewport.width},${this.viewport.height}`,
      '--start-maximized',

      // Memory and performance
      '--memory-pressure-off',
      '--max_old_space_size=4096',

      // User data isolation
      '--user-data-dir=/tmp/chrome-proxy-session',
      '--profile-directory=Default',

      // Remote debugging
      '--remote-debugging-address=0.0.0.0',
      '--remote-debugging-port=9222',
      '--no-first-run'
    ];

    // Add proxy configuration if provided
    if (this.proxyConfig) {
      const { host, port, username, password } = this.proxyConfig;
      if (username && password) {
        baseFlags.push(`--proxy-server=${host}:${port}`);
        // Authentication will be handled via page.authenticate()
      } else {
        baseFlags.push(`--proxy-server=${host}:${port}`);
      }
    }

    return baseFlags;
  }

  // Residential IP geographic consistency
  getGeoConsistentHeaders(location = 'US') {
    const geoHeaders = {
      'US': {
        'Accept-Language': 'en-US,en;q=0.9',
        'CF-IPCountry': 'US',
        'CF-RAY': this.generateRayId(),
        'CF-Visitor': '{"scheme":"https"}',
        'timezone': 'America/New_York'
      },
      'UK': {
        'Accept-Language': 'en-GB,en;q=0.9',
        'CF-IPCountry': 'GB',
        'CF-RAY': this.generateRayId(),
        'CF-Visitor': '{"scheme":"https"}',
        'timezone': 'Europe/London'
      },
      'CA': {
        'Accept-Language': 'en-CA,en;q=0.9',
        'CF-IPCountry': 'CA',
        'CF-RAY': this.generateRayId(),
        'CF-Visitor': '{"scheme":"https"}',
        'timezone': 'America/Toronto'
      }
    };

    const selectedGeo = geoHeaders[location] || geoHeaders['US'];

    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': selectedGeo['Accept-Language'],
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': this.userAgent,
      'X-Forwarded-For': this.generateResidentialIP(),
      'X-Real-IP': this.generateResidentialIP()
    };
  }

  generateRayId() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  generateResidentialIP() {
    // Generate realistic residential IP ranges
    const residentialRanges = [
      '73.', '72.', '74.', '75.', '76.', // US residential ISPs
      '96.', '97.', '98.', '99.',       // More US ranges
      '24.', '50.', '67.', '68.'        // Cable/DSL ranges
    ];

    const prefix = residentialRanges[Math.floor(Math.random() * residentialRanges.length)];
    const second = Math.floor(Math.random() * 255);
    const third = Math.floor(Math.random() * 255);
    const fourth = Math.floor(Math.random() * 255) + 1;

    return `${prefix}${second}.${third}.${fourth}`;
  }

  // Enhanced fingerprinting protection with proxy awareness
  async injectProxyAwareProtections(page) {
    await page.evaluateOnNewDocument(() => {
      // 1. Enhanced Canvas Protection with proxy-specific noise
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          const data = imageData.data;

          // Proxy-specific noise pattern
          const proxyNoise = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < data.length; i += 4) {
            data[i] += proxyNoise;
            data[i + 1] += proxyNoise;
            data[i + 2] += proxyNoise;
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, arguments);
      };

      // 2. WebGL Protection with residential device simulation
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attributes) {
        if (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2') {
          const context = getContext.call(this, type, attributes);
          if (context) {
            const getParameter = context.getParameter;
            context.getParameter = function(parameter) {
              // Simulate common residential device WebGL info
              const residentialSpoof = {
                [context.VERSION]: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
                [context.SHADING_LANGUAGE_VERSION]: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
                [context.VENDOR]: 'WebKit',
                [context.RENDERER]: 'WebKit WebGL',
                [context.UNMASKED_VENDOR_WEBGL]: 'Intel Inc.',
                [context.UNMASKED_RENDERER_WEBGL]: 'Intel HD Graphics 620' // Common residential GPU
              };
              return residentialSpoof[parameter] || getParameter.call(this, parameter);
            };
          }
          return context;
        }
        return getContext.call(this, type, attributes);
      };

      // 3. Network Information API Spoofing for residential connections
      if (navigator.connection) {
        Object.defineProperty(navigator.connection, 'effectiveType', {
          get: () => '4g' // Residential typically has good connection
        });
        Object.defineProperty(navigator.connection, 'downlink', {
          get: () => Math.random() * 50 + 25 // 25-75 Mbps typical residential
        });
        Object.defineProperty(navigator.connection, 'rtt', {
          get: () => Math.floor(Math.random() * 30) + 20 // 20-50ms typical residential
        });
      }

      // 4. Geolocation consistency with proxy location
      if (navigator.geolocation) {
        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
          // Simulate US residential location
          success({
            coords: {
              latitude: 40.7128 + (Math.random() - 0.5) * 2,  // NYC area with variance
              longitude: -74.0060 + (Math.random() - 0.5) * 2,
              accuracy: Math.random() * 1000 + 100
            },
            timestamp: Date.now()
          });
        };
      }

      // 5. Enhanced timezone consistency
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        return -300; // EST (residential US)
      };

      // 6. Language and locale consistency
      Object.defineProperty(navigator, 'language', {
        get: function() { return 'en-US'; }
      });
      Object.defineProperty(navigator, 'languages', {
        get: function() { return ['en-US', 'en']; }
      });

      // 7. Screen configuration for typical residential device
      Object.defineProperty(screen, 'width', { get: () => 1366 });
      Object.defineProperty(screen, 'height', { get: () => 768 });
      Object.defineProperty(screen, 'availWidth', { get: () => 1366 });
      Object.defineProperty(screen, 'availHeight', { get: () => 728 });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
      Object.defineProperty(screen, 'pixelDepth', { get: () => 24 });

      // 8. Hardware concurrency for residential devices
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 // Common residential CPU
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8 // Common residential RAM
      });

      // 9. Plugin list for residential Chrome
      Object.defineProperty(navigator, 'plugins', {
        get: function() {
          return {
            length: 5,
            0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
            3: { name: 'Widevine Content Decryption Module', filename: 'widevinecdmadapter.dll', description: 'Enables Widevine licenses for playback of HTML audio/video content.' },
            4: { name: 'Microsoft Edge PDF Viewer', filename: 'edge_pdf_viewer', description: 'PDF Viewer' }
          };
        }
      });

      // 10. Performance memory spoofing for residential device
      if (performance && performance.memory) {
        Object.defineProperty(performance.memory, 'usedJSHeapSize', {
          get: () => Math.floor(Math.random() * 30000000) + 20000000 // 20-50MB typical
        });
        Object.defineProperty(performance.memory, 'totalJSHeapSize', {
          get: () => Math.floor(Math.random() * 50000000) + 50000000 // 50-100MB typical
        });
        Object.defineProperty(performance.memory, 'jsHeapSizeLimit', {
          get: () => 2172649472 // Standard limit
        });
      }

      console.log('Proxy-aware fingerprinting protections injected');
    });
  }

  // Enhanced behavioral patterns that account for proxy latency
  async implementProxyOptimizedBehavior(page) {
    console.log('Implementing proxy-optimized behavioral patterns...');

    // Account for proxy latency in timing
    const proxyDelay = this.proxyConfig ? 500 : 0; // Additional delay for proxy

    // 1. Slower, more deliberate movements (accounting for proxy latency)
    await this.proxyOptimizedScrolling(page, proxyDelay);
    await this.randomDelay(2000 + proxyDelay, 4000 + proxyDelay);

    // 2. Mouse behavior accounting for network delay
    await this.proxyOptimizedMouseBehavior(page, proxyDelay);
    await this.randomDelay(1000 + proxyDelay, 3000 + proxyDelay);

    // 3. Focus changes with proxy considerations
    await this.proxyOptimizedFocusChanges(page, proxyDelay);
  }

  async proxyOptimizedScrolling(page, proxyDelay = 0) {
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    if (scrollHeight <= viewportHeight) return;

    const scrollSteps = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < scrollSteps; i++) {
      const scrollPosition = Math.floor((scrollHeight / scrollSteps) * i) + Math.random() * 150;

      await page.evaluate((pos) => {
        window.scrollTo({
          top: pos,
          behavior: 'smooth'
        });
      }, scrollPosition);

      // Longer pauses to account for proxy latency and appear more human
      await this.randomDelay(1500 + proxyDelay, 4000 + proxyDelay);
    }
  }

  async proxyOptimizedMouseBehavior(page, proxyDelay = 0) {
    const viewport = await page.viewport();
    const movements = [
      { x: viewport.width * 0.3, y: viewport.height * 0.2 },
      { x: viewport.width * 0.7, y: viewport.height * 0.4 },
      { x: viewport.width * 0.5, y: viewport.height * 0.7 },
    ];

    for (const target of movements) {
      const steps = Math.floor(Math.random() * 20) + 15; // More steps for smoother proxy movement
      await page.mouse.move(target.x, target.y, { steps });

      // Account for proxy response time
      await this.randomDelay(300 + proxyDelay, 1000 + proxyDelay);

      if (Math.random() < 0.2) { // Less frequent clicks through proxy
        await page.mouse.click(target.x, target.y);
        await this.randomDelay(200 + proxyDelay, 800 + proxyDelay);
      }
    }
  }

  async proxyOptimizedFocusChanges(page, proxyDelay = 0) {
    await page.evaluate(() => {
      window.blur();
      setTimeout(() => window.focus(), 2000); // Longer delay for proxy environment
    });
    await this.randomDelay(2000 + proxyDelay, 4000 + proxyDelay);
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Main bypass function with proxy support
  async bypassWithProxy(targetUrl, location = 'US') {
    try {
      console.log('Launching Chrome with proxy configuration...');

      // Launch Chrome with proxy-aware flags
      this.chromeProcess = spawn('/usr/bin/google-chrome-stable', this.getProxyAwareChromeFlags(), {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      await this.randomDelay(5000, 8000); // Extra time for proxy setup

      // Get WebSocket endpoint
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
              reject(new Error('Failed to parse Chrome info: ' + e.message));
            }
          });
        });

        req.on('error', (err) => {
          reject(new Error('Failed to get Chrome WebSocket endpoint: ' + err.message));
        });

        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Timeout getting Chrome WebSocket endpoint'));
        });
      });

      // Connect to Chrome
      const browser = await puppeteerCore.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: this.viewport
      });

      const page = await browser.newPage();

      // Set proxy authentication if required
      if (this.proxyConfig && this.proxyConfig.username && this.proxyConfig.password) {
        await page.authenticate({
          username: this.proxyConfig.username,
          password: this.proxyConfig.password
        });
      }

      // Apply all protections
      await this.injectProxyAwareProtections(page);

      // Set geo-consistent headers
      const headers = this.getGeoConsistentHeaders(location);
      await page.setExtraHTTPHeaders(headers);
      await page.setUserAgent(headers['User-Agent']);

      // Set up request interception for token capture
      await page.setRequestInterception(true);

      page.on('request', request => {
        const url = request.url();

        if (url.includes('/api/') || url.includes('ohmyrockness') ||
            url.includes('shows') || url.includes('graphql') || url.includes('.json')) {
          console.log('>>> API Request detected:', url);

          const headers = request.headers();
          const authHeaders = ['authorization', 'x-auth-token', 'x-api-key', 'x-access-token', 'bearer', 'token'];

          authHeaders.forEach(header => {
            if (headers[header]) {
              console.log(`>>> Found auth header ${header}:`, headers[header]);
              this.auth = headers[header];
            }
          });
        }

        request.continue();
      });

      console.log('Navigating through proxy with advanced protections...');

      // Navigate with proxy-optimized timing
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 180000 // Longer timeout for proxy environments
      });

      // Implement proxy-optimized behavioral patterns
      await this.implementProxyOptimizedBehavior(page);

      // Enhanced challenge detection loop
      let attempts = 0;
      const maxAttempts = 40; // Adjusted for proxy latency

      while (attempts < maxAttempts) {
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            hasCloudflareText: document.body && (
              document.body.innerText.includes('Cloudflare') ||
              document.body.innerText.includes('Just a moment') ||
              document.body.innerText.includes('Verifying you are human') ||
              document.body.innerText.includes('Ray ID')
            ),
            hasRealContent: document.querySelectorAll('*').length > 100 &&
                           (!document.body || !document.body.innerText.includes('Just a moment')),
            elementCount: document.querySelectorAll('*').length,
            hasTurnstile: document.querySelector('.cf-turnstile, iframe[src*="turnstile"], iframe[src*="challenges.cloudflare.com"]') !== null
          };
        });

        console.log(`[Proxy] Attempt ${attempts + 1}/${maxAttempts}: ${pageInfo.title} (${pageInfo.elementCount} elements)`);

        if (!pageInfo.hasCloudflareText && pageInfo.hasRealContent && !pageInfo.hasTurnstile) {
          console.log('✓ [Proxy] Successfully bypassed Cloudflare through proxy!');
          break;
        }

        if (pageInfo.hasCloudflareText || pageInfo.hasTurnstile) {
          console.log('⏳ [Proxy] Challenge detected, applying proxy-optimized bypass...');

          // Proxy-optimized challenge handling
          await this.implementProxyOptimizedBehavior(page);

          // Try challenge interaction
          const proxyDelay = this.proxyConfig ? 1000 : 0;
          await page.evaluate(() => {
            const challengeElements = document.querySelectorAll(
              '.cf-turnstile, iframe[src*="turnstile"], input[type="checkbox"], button[type="submit"]'
            );

            challengeElements.forEach((el, idx) => {
              setTimeout(() => {
                try {
                  el.click();
                  console.log(`Clicked challenge element ${idx}`);
                } catch (e) {
                  console.log(`Failed to click element ${idx}:`, e.message);
                }
              }, idx * 1000); // Stagger clicks through proxy
            });
          });

          await this.randomDelay(8000 + proxyDelay, 15000 + proxyDelay);
        }

        attempts++;
        await this.randomDelay(5000 + (this.proxyConfig ? 2000 : 0), 10000 + (this.proxyConfig ? 3000 : 0));
      }

      console.log('Final auth token status:', this.auth ? '✓ Token acquired through proxy' : '✗ No token found');

      // Cleanup
      await browser.disconnect();
      if (this.chromeProcess) {
        this.chromeProcess.kill();
      }

      return {
        token: this.auth,
        success: !!this.auth,
        proxy: this.proxyConfig ? `${this.proxyConfig.host}:${this.proxyConfig.port}` : 'none',
        location: location
      };

    } catch (error) {
      console.error('Proxy bypass error:', error.message);

      if (this.chromeProcess) {
        this.chromeProcess.kill();
      }

      return { token: null, success: false, error: error.message };
    }
  }
}

// Usage examples
async function runWithRotatingProxies() {
  const proxies = [
    { host: '127.0.0.1', port: 8080, username: 'user1', password: 'pass1' },
    { host: '127.0.0.1', port: 8081, username: 'user2', password: 'pass2' },
    // Add your residential proxy endpoints here
  ];

  for (const proxy of proxies) {
    console.log(`\n🔄 Trying proxy: ${proxy.host}:${proxy.port}`);

    const bypass = new ProxyEnhancedBypass({
      proxy: proxy,
      viewport: { width: 1366, height: 768 }
    });

    const result = await bypass.bypassWithProxy('https://www.ohmyrockness.com/shows?all=true', 'US');

    if (result.success) {
      console.log('✅ Success with proxy:', proxy.host + ':' + proxy.port);
      return result;
    } else {
      console.log('❌ Failed with proxy:', proxy.host + ':' + proxy.port);
    }

    // Wait between proxy attempts
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('❌ All proxies failed');
  return { success: false, message: 'All proxies failed' };
}

// Direct usage without proxy rotation
async function runWithSingleProxy() {
  const bypass = new ProxyEnhancedBypass({
    proxy: {
      host: '127.0.0.1',
      port: 8080,
      username: 'your_username',
      password: 'your_password'
    }
  });

  return await bypass.bypassWithProxy('https://www.ohmyrockness.com/shows?all=true', 'US');
}

// Export for use in other modules
module.exports = {
  ProxyEnhancedBypass,
  runWithRotatingProxies,
  runWithSingleProxy
};

// Run if called directly
if (require.main === module) {
  runWithRotatingProxies()
    .then(result => {
      console.log('Final result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}