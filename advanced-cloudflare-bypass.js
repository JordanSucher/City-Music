const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');

/**
 * Advanced Cloudflare Bypass Implementation for Server Environments
 * Focuses on comprehensive fingerprinting evasion and behavioral simulation
 */

class AdvancedCloudflareBypass {
  constructor() {
    this.chromeProcess = null;
    this.auth = null;
  }

  // 1. Advanced TLS Fingerprinting Bypass
  getTLSBypassFlags() {
    return [
      // TLS/SSL Configuration
      '--cipher-suite-blacklist=0x009c,0x009d,0x002f,0x0035,0x000a',
      '--ssl-version-fallback-min=tls1.2',
      '--ssl-key-log-file=/tmp/ssl-keys.log',

      // HTTP/2 Configuration to match real browsers
      '--enable-http2-grease',
      '--http2-settings-grease',

      // Advanced stealth flags
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees',
      '--disable-ipc-flooding-protection',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--enable-automation=false',

      // Hardware acceleration and rendering
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--enable-accelerated-2d-canvas',
      '--enable-accelerated-mjpeg-decode',
      '--enable-accelerated-video-decode',
      '--enable-gpu-memory-buffer-video-frames',
      '--enable-native-gpu-memory-buffers',

      // Font and rendering consistency
      '--font-render-hinting=auto',
      '--enable-font-antialiasing',
      '--enable-lcd-text',

      // Network timing randomization
      '--enable-quic',
      '--enable-tcp-fast-open',
      '--max-connections-per-host=6',
    ];
  }

  // 2. Canvas and WebGL Fingerprinting Bypass
  async injectCanvasProtection(page) {
    await page.evaluateOnNewDocument(() => {
      // Canvas fingerprinting protection with noise injection
      const getImageData = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        // Inject subtle noise to avoid detection
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          const data = imageData.data;

          // Add minimal noise that's undetectable to humans
          for (let i = 0; i < data.length; i += 4) {
            data[i] += Math.floor(Math.random() * 2); // Red
            data[i + 1] += Math.floor(Math.random() * 2); // Green
            data[i + 2] += Math.floor(Math.random() * 2); // Blue
          }
          context.putImageData(imageData, 0, 0);
        }
        return getImageData.apply(this, arguments);
      };

      // WebGL fingerprinting protection
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, attributes) {
        if (type === 'webgl' || type === 'experimental-webgl') {
          const context = getContext.call(this, type, attributes);
          if (context) {
            // Spoof WebGL parameters
            const getParameter = context.getParameter;
            context.getParameter = function(parameter) {
              // Common WebGL parameters to spoof
              if (parameter === context.VERSION) return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
              if (parameter === context.SHADING_LANGUAGE_VERSION) return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
              if (parameter === context.VENDOR) return 'WebKit';
              if (parameter === context.RENDERER) return 'WebKit WebGL';
              return getParameter.call(this, parameter);
            };
          }
          return context;
        }
        return getContext.call(this, type, attributes);
      };
    });
  }

  // 3. WebRTC Fingerprinting Bypass
  async injectWebRTCProtection(page) {
    await page.evaluateOnNewDocument(() => {
      // Disable WebRTC IP leak
      if (typeof RTCPeerConnection !== 'undefined') {
        const RTCPeerConnection = window.RTCPeerConnection;
        window.RTCPeerConnection = function(...args) {
          const pc = new RTCPeerConnection(...args);
          const createDataChannel = pc.createDataChannel;
          pc.createDataChannel = function() {
            throw new Error('WebRTC blocked');
          };
          return pc;
        };
      }

      // Block WebRTC media devices
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied'));
      }
    });
  }

  // 4. Audio Context Fingerprinting Bypass
  async injectAudioProtection(page) {
    await page.evaluateOnNewDocument(() => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const createAnalyser = AudioContext.prototype.createAnalyser;
        AudioContext.prototype.createAnalyser = function() {
          const analyser = createAnalyser.call(this);
          const getFloatFrequencyData = analyser.getFloatFrequencyData;
          analyser.getFloatFrequencyData = function(array) {
            getFloatFrequencyData.call(this, array);
            // Add subtle noise
            for (let i = 0; i < array.length; i++) {
              array[i] += (Math.random() - 0.5) * 0.0001;
            }
          };
          return analyser;
        };
      }
    });
  }

  // 5. Font Fingerprinting Bypass
  async injectFontProtection(page) {
    await page.evaluateOnNewDocument(() => {
      // Standardize font list
      const standardFonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
        'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Arial Black', 'Impact'
      ];

      // Override font detection methods
      if (document.fonts && document.fonts.check) {
        const originalCheck = document.fonts.check;
        document.fonts.check = function(font, text) {
          const fontFamily = font.split(' ').pop().replace(/['"]/g, '');
          return standardFonts.includes(fontFamily);
        };
      }
    });
  }

  // 6. Advanced User Agent and Header Management
  getAdvancedHeaders() {
    return {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
  }

  // 7. Human-like Mouse Movement Simulation
  async simulateHumanMouse(page) {
    // Install ghost-cursor-like behavior
    await page.evaluateOnNewDocument(() => {
      let lastMouseX = 0;
      let lastMouseY = 0;

      // Create realistic mouse movement patterns
      function createMousePath(startX, startY, endX, endY) {
        const path = [];
        const steps = Math.floor(Math.random() * 10) + 10;

        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const ease = 0.5 - Math.cos(progress * Math.PI) / 2; // Ease in-out

          // Add some randomness to the path
          const randomOffsetX = (Math.random() - 0.5) * 20;
          const randomOffsetY = (Math.random() - 0.5) * 20;

          const x = startX + (endX - startX) * ease + randomOffsetX;
          const y = startY + (endY - startY) * ease + randomOffsetY;

          path.push({ x: Math.round(x), y: Math.round(y) });
        }
        return path;
      }

      // Override mouse events to add human-like patterns
      const originalAddEventListener = Document.prototype.addEventListener;
      Document.prototype.addEventListener = function(type, listener, options) {
        if (type === 'mousemove') {
          const humanListener = function(e) {
            // Simulate human-like mouse jitter
            const jitterX = (Math.random() - 0.5) * 2;
            const jitterY = (Math.random() - 0.5) * 2;

            Object.defineProperty(e, 'clientX', { value: e.clientX + jitterX });
            Object.defineProperty(e, 'clientY', { value: e.clientY + jitterY });

            lastMouseX = e.clientX;
            lastMouseY = e.clientY;

            return listener.call(this, e);
          };
          return originalAddEventListener.call(this, type, humanListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });

    // Perform actual mouse movements
    const viewport = await page.viewport();
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    // Simulate human-like mouse movements
    for (let i = 0; i < 3; i++) {
      const targetX = Math.random() * viewport.width;
      const targetY = Math.random() * viewport.height;

      await page.mouse.move(targetX, targetY, { steps: Math.floor(Math.random() * 10) + 5 });
      await this.randomDelay(100, 500);
    }
  }

  // 8. Keyboard Simulation with Human Timing
  async simulateHumanTyping(page, selector, text) {
    await page.focus(selector);

    for (const char of text) {
      await page.keyboard.type(char);
      // Human-like typing delays
      const delay = Math.random() * 150 + 50; // 50-200ms between keystrokes
      await this.randomDelay(delay, delay + 50);
    }
  }

  // 9. Network Timing Pattern Simulation
  async simulateNetworkTiming() {
    // Add random delays to simulate network latency
    const networkDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    await this.randomDelay(networkDelay, networkDelay + 500);
  }

  // 10. Screen Resolution and Viewport Management
  getRealisticViewport() {
    const commonResolutions = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1600, height: 900 },
      { width: 1280, height: 720 }
    ];

    return commonResolutions[Math.floor(Math.random() * commonResolutions.length)];
  }

  // 11. Timezone and Locale Spoofing
  async injectTimezoneProtection(page) {
    await page.evaluateOnNewDocument(() => {
      // Spoof timezone
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        return -300; // EST timezone
      };

      // Spoof locale
      Object.defineProperty(navigator, 'language', {
        get: function() { return 'en-US'; }
      });

      Object.defineProperty(navigator, 'languages', {
        get: function() { return ['en-US', 'en']; }
      });
    });
  }

  // 12. Behavioral Pattern Implementation
  async implementBehavioralPatterns(page) {
    // Human-like scrolling
    await this.humanScroll(page);
    await this.randomDelay(1000, 3000);

    // Random clicks on non-interactive elements
    await this.randomClicks(page);
    await this.randomDelay(2000, 4000);

    // Focus changes
    await this.simulateFocusChanges(page);
  }

  async humanScroll(page) {
    const viewport = await page.viewport();
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

    // Scroll in human-like patterns
    const scrollSteps = Math.floor(Math.random() * 5) + 3;
    const stepSize = scrollHeight / scrollSteps;

    for (let i = 0; i < scrollSteps; i++) {
      const scrollPosition = stepSize * i + Math.random() * 100;
      await page.evaluate((pos) => {
        window.scrollTo({
          top: pos,
          behavior: 'smooth'
        });
      }, scrollPosition);

      await this.randomDelay(500, 1500);
    }
  }

  async randomClicks(page) {
    const viewport = await page.viewport();

    for (let i = 0; i < 3; i++) {
      const x = Math.random() * viewport.width;
      const y = Math.random() * viewport.height;

      try {
        await page.mouse.click(x, y);
      } catch (e) {
        // Ignore click failures on non-interactive elements
      }

      await this.randomDelay(800, 2000);
    }
  }

  async simulateFocusChanges(page) {
    await page.evaluate(() => {
      // Simulate focus/blur events
      window.focus();
      setTimeout(() => window.blur(), Math.random() * 1000);
      setTimeout(() => window.focus(), Math.random() * 2000 + 1000);
    });
  }

  // Utility function for random delays
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // 13. Advanced Chrome Launch Configuration
  async launchAdvancedChrome() {
    const viewport = this.getRealisticViewport();

    const chromeFlags = [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',

      // Advanced fingerprinting evasion
      ...this.getTLSBypassFlags(),

      // Viewport and display
      `--window-size=${viewport.width},${viewport.height}`,
      '--start-maximized',

      // Memory and performance
      '--memory-pressure-off',
      '--max_old_space_size=4096',
      '--no-zygote',

      // Network configuration
      '--aggressive-cache-discard',
      '--enable-features=NetworkService,NetworkServiceLogging',

      // User data
      '--user-data-dir=/tmp/chrome-user-data-advanced',
      '--profile-directory=Default',

      // Remote debugging
      '--remote-debugging-address=0.0.0.0',
      '--remote-debugging-port=9222',
    ];

    console.log('Launching Chrome with advanced configuration...');

    this.chromeProcess = spawn('/usr/bin/google-chrome-stable', chromeFlags, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for Chrome to start
    await this.randomDelay(3000, 5000);
    return this.chromeProcess;
  }

  // 14. Main bypass function
  async bypassCloudflare(targetUrl) {
    try {
      await this.launchAdvancedChrome();

      // Get WebSocket endpoint
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

        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Timeout getting Chrome WebSocket endpoint'));
        });
      });

      // Connect to Chrome
      const browser = await puppeteerCore.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: this.getRealisticViewport()
      });

      const page = await browser.newPage();

      // Apply all fingerprinting protections
      await this.injectCanvasProtection(page);
      await this.injectWebRTCProtection(page);
      await this.injectAudioProtection(page);
      await this.injectFontProtection(page);
      await this.injectTimezoneProtection(page);

      // Set headers and user agent
      await page.setExtraHTTPHeaders(this.getAdvancedHeaders());
      await page.setUserAgent(this.getAdvancedHeaders()['User-Agent']);

      // Set up request interception for token capture
      await page.setRequestInterception(true);

      page.on('request', request => {
        const url = request.url();

        if (url.includes('/api/') || url.includes('ohmyrockness') ||
            url.includes('shows') || url.includes('graphql') || url.includes('.json')) {
          console.log('>>> API Request:', url);

          const headers = request.headers();
          const authHeaders = ['authorization', 'x-auth-token', 'x-api-key', 'x-access-token', 'bearer', 'token'];

          authHeaders.forEach(header => {
            if (headers[header]) {
              console.log(`>>> Found ${header}:`, headers[header]);
              this.auth = headers[header];
            }
          });
        }

        request.continue();
      });

      console.log('Navigating with advanced protections...');

      // Add network timing simulation
      await this.simulateNetworkTiming();

      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      });

      console.log('Implementing behavioral patterns...');
      await this.implementBehavioralPatterns(page);

      // Enhanced challenge detection and bypass
      let attempts = 0;
      const maxAttempts = 50; // Increased attempts for server environment

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
              document.body.innerText.includes('Please wait') ||
              document.body.innerText.includes('Ray ID')
            ),
            hasRealContent: document.querySelectorAll('*').length > 100 &&
                           (!document.body || !document.body.innerText.includes('Just a moment')),
            elementCount: document.querySelectorAll('*').length,
            hasTurnstile: document.querySelector('.cf-turnstile') !== null ||
                         document.querySelector('iframe[src*="challenges.cloudflare.com"]') !== null
          };
        });

        console.log(`Attempt ${attempts + 1}/${maxAttempts}: ${pageInfo.title} (${pageInfo.elementCount} elements)`);

        if (!pageInfo.hasCloudflareText && pageInfo.hasRealContent) {
          console.log('Successfully bypassed Cloudflare! Real content loaded.');
          break;
        }

        if (pageInfo.hasCloudflareText || pageInfo.hasTurnstile) {
          console.log('Cloudflare challenge detected. Applying advanced bypass techniques...');

          // Enhanced mouse simulation during challenge
          await this.simulateHumanMouse(page);

          // Try to interact with Turnstile challenge
          try {
            const interactionResult = await page.evaluate(() => {
              const selectors = [
                '.cf-turnstile',
                'iframe[src*="challenges.cloudflare.com"]',
                'iframe[src*="turnstile"]',
                'input[type="checkbox"]',
                'button[type="submit"]',
                '.cf-challenge-submit',
                '#challenge-form input[type="submit"]'
              ];

              let results = [];
              for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  results.push(`Found ${selector}: ${elements.length} elements`);

                  elements.forEach((el, idx) => {
                    try {
                      // Add human-like delay before clicking
                      setTimeout(() => {
                        el.click();
                        results.push(`clicked ${selector}[${idx}]`);
                      }, Math.random() * 1000 + 500);
                    } catch (e) {
                      results.push(`couldn't click ${selector}[${idx}]: ${e.message}`);
                    }
                  });
                }
              }

              return results.length > 0 ? results.join('; ') : 'no challenge elements found';
            });

            if (interactionResult !== 'no challenge elements found') {
              console.log('Challenge interaction results:', interactionResult);
              await this.randomDelay(5000, 8000); // Wait after interaction
            }
          } catch (e) {
            console.log('Error interacting with challenge:', e.message);
          }
        }

        attempts++;
        await this.randomDelay(3000, 6000); // Random delays between attempts
      }

      // Final interaction sequence
      if (!this.auth) {
        console.log('No auth token found, performing final interaction sequence...');
        await this.implementBehavioralPatterns(page);
        await this.randomDelay(5000, 10000);
      }

      console.log('Final auth token:', this.auth || 'Not found');

      // Cleanup
      await browser.disconnect();
      if (this.chromeProcess) {
        this.chromeProcess.kill();
      }

      return { token: this.auth, success: !!this.auth };

    } catch (error) {
      console.error('Advanced bypass error:', error);

      if (this.chromeProcess) {
        this.chromeProcess.kill();
      }

      return { token: null, success: false, error: error.message };
    }
  }
}

module.exports = AdvancedCloudflareBypass;

// Usage example
if (require.main === module) {
  const bypass = new AdvancedCloudflareBypass();
  bypass.bypassCloudflare('https://www.ohmyrockness.com/shows?all=true')
    .then(result => {
      console.log('Final result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}