const puppeteerCore = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Comprehensive Testing and Debugging Suite for Cloudflare Bypass
 * Tests all 15 advanced techniques and provides detailed reporting
 */

class BypassTestingSuite {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        chrome: null,
        memory: process.memoryUsage()
      }
    };
    this.logDir = '/tmp/bypass-tests';
  }

  async initializeLogging() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      console.log('✓ Logging directory created:', this.logDir);
    } catch (e) {
      console.warn('⚠️ Failed to create logging directory:', e.message);
    }
  }

  async detectChromeVersion() {
    try {
      const { spawn } = require('child_process');
      return new Promise((resolve, reject) => {
        const chrome = spawn('/usr/bin/google-chrome-stable', ['--version']);
        let output = '';

        chrome.stdout.on('data', (data) => {
          output += data.toString();
        });

        chrome.on('close', (code) => {
          if (code === 0) {
            const version = output.trim().match(/\d+\.\d+\.\d+\.\d+/);
            resolve(version ? version[0] : 'unknown');
          } else {
            reject(new Error('Failed to get Chrome version'));
          }
        });

        chrome.on('error', reject);
      });
    } catch (e) {
      return 'detection failed';
    }
  }

  async testFingerprinting() {
    console.log('\n🔍 Testing Fingerprinting Detection...');

    const testResult = {
      name: 'Fingerprinting Detection Test',
      status: 'running',
      startTime: Date.now(),
      details: {}
    };

    try {
      const chromeProcess = spawn('/usr/bin/google-chrome-stable', [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=9223',
        '--user-data-dir=/tmp/chrome-fingerprint-test'
      ]);

      await this.delay(3000);

      const http = require('http');
      const wsEndpoint = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:9223/json/version', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const info = JSON.parse(data);
              resolve(info.webSocketDebuggerUrl);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });

      const browser = await puppeteerCore.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: { width: 1366, height: 768 }
      });

      const page = await browser.newPage();

      // Test various fingerprinting techniques
      const fingerprintTests = await page.evaluate(() => {
        const results = {};

        // 1. WebDriver detection
        results.webdriverPresent = navigator.webdriver !== undefined;

        // 2. Chrome runtime detection
        results.chromeRuntime = window.chrome && window.chrome.runtime && window.chrome.runtime.onConnect;

        // 3. Plugin consistency
        results.pluginCount = navigator.plugins.length;

        // 4. Language consistency
        results.languages = navigator.languages;

        // 5. Screen properties
        results.screen = {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        };

        // 6. Hardware concurrency
        results.hardwareConcurrency = navigator.hardwareConcurrency;

        // 7. Device memory
        results.deviceMemory = navigator.deviceMemory;

        // 8. Canvas fingerprint test
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Browser fingerprint test', 2, 2);
          results.canvasFingerprint = canvas.toDataURL().substring(0, 50);
        } catch (e) {
          results.canvasError = e.message;
        }

        // 9. WebGL fingerprint test
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            results.webglVendor = gl.getParameter(gl.VENDOR);
            results.webglRenderer = gl.getParameter(gl.RENDERER);
          }
        } catch (e) {
          results.webglError = e.message;
        }

        // 10. Audio context test
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          results.audioContextState = audioContext.state;
          results.audioSampleRate = audioContext.sampleRate;
        } catch (e) {
          results.audioError = e.message;
        }

        return results;
      });

      testResult.details = fingerprintTests;

      // Analyze results
      let suspiciousCount = 0;
      if (fingerprintTests.webdriverPresent) suspiciousCount++;
      if (fingerprintTests.pluginCount < 3) suspiciousCount++;
      if (fingerprintTests.hardwareConcurrency === undefined) suspiciousCount++;

      testResult.suspiciousCount = suspiciousCount;
      testResult.status = suspiciousCount > 2 ? 'failed' : 'passed';

      await browser.disconnect();
      chromeProcess.kill();

      console.log(`  Fingerprinting test: ${testResult.status.toUpperCase()}`);
      console.log(`  Suspicious indicators: ${suspiciousCount}/10`);

    } catch (error) {
      testResult.status = 'error';
      testResult.error = error.message;
      console.log(`  Fingerprinting test: ERROR - ${error.message}`);
    }

    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - testResult.startTime;

    return testResult;
  }

  async testCloudflareBypass(url = 'https://www.ohmyrockness.com/shows?all=true') {
    console.log('\n🛡️ Testing Cloudflare Bypass...');

    const testResult = {
      name: 'Cloudflare Bypass Test',
      status: 'running',
      startTime: Date.now(),
      url: url,
      attempts: 0,
      challengesDetected: 0,
      details: {}
    };

    try {
      const chromeProcess = spawn('/usr/bin/google-chrome-stable', [
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--exclude-switches=enable-automation',
        '--remote-debugging-port=9224',
        '--user-data-dir=/tmp/chrome-bypass-test'
      ]);

      await this.delay(3000);

      const http = require('http');
      const wsEndpoint = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:9224/json/version', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const info = JSON.parse(data);
              resolve(info.webSocketDebuggerUrl);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });

      const browser = await puppeteerCore.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: { width: 1366, height: 768 }
      });

      const page = await browser.newPage();

      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      console.log(`  Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Monitor for challenges
      const maxAttempts = 30;
      let challengeResolved = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        testResult.attempts = attempt;

        const pageAnalysis = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyLength: document.body ? document.body.innerText.length : 0,
            hasCloudflareText: document.body && (
              document.body.innerText.includes('Cloudflare') ||
              document.body.innerText.includes('Just a moment') ||
              document.body.innerText.includes('Verifying you are human') ||
              document.body.innerText.includes('Ray ID')
            ),
            hasTurnstile: document.querySelector('.cf-turnstile') !== null ||
                         document.querySelector('iframe[src*="turnstile"]') !== null,
            elementCount: document.querySelectorAll('*').length,
            hasRealContent: document.querySelectorAll('*').length > 100 &&
                           document.body &&
                           !document.body.innerText.includes('Just a moment') &&
                           !document.body.innerText.includes('Verifying you are human')
          };
        });

        console.log(`    Attempt ${attempt}/${maxAttempts}: ${pageAnalysis.title} (${pageAnalysis.elementCount} elements)`);

        if (pageAnalysis.hasCloudflareText || pageAnalysis.hasTurnstile) {
          testResult.challengesDetected++;
          console.log(`      Challenge detected (total: ${testResult.challengesDetected})`);
        }

        if (pageAnalysis.hasRealContent && !pageAnalysis.hasCloudflareText && !pageAnalysis.hasTurnstile) {
          console.log('      ✓ Real content loaded - bypass successful!');
          challengeResolved = true;
          testResult.status = 'passed';
          break;
        }

        await this.delay(2000);
      }

      if (!challengeResolved) {
        testResult.status = 'failed';
        console.log('      ✗ Failed to bypass after maximum attempts');
      }

      testResult.details.finalUrl = await page.url();
      testResult.details.finalTitle = await page.title();

      await browser.disconnect();
      chromeProcess.kill();

    } catch (error) {
      testResult.status = 'error';
      testResult.error = error.message;
      console.log(`    Bypass test: ERROR - ${error.message}`);
    }

    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - testResult.startTime;

    return testResult;
  }

  async testMouseBehavior() {
    console.log('\n🖱️ Testing Mouse Behavior Simulation...');

    const testResult = {
      name: 'Mouse Behavior Test',
      status: 'running',
      startTime: Date.now(),
      details: {}
    };

    try {
      const chromeProcess = spawn('/usr/bin/google-chrome-stable', [
        '--headless=new',
        '--no-sandbox',
        '--remote-debugging-port=9225',
        '--user-data-dir=/tmp/chrome-mouse-test'
      ]);

      await this.delay(3000);

      const http = require('http');
      const wsEndpoint = await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:9225/json/version', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const info = JSON.parse(data);
              resolve(info.webSocketDebuggerUrl);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
      });

      const browser = await puppeteerCore.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: { width: 1366, height: 768 }
      });

      const page = await browser.newPage();

      // Inject mouse tracking
      await page.evaluateOnNewDocument(() => {
        window.mouseEvents = [];
        document.addEventListener('mousemove', (e) => {
          window.mouseEvents.push({
            type: 'move',
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
          });
        });
        document.addEventListener('click', (e) => {
          window.mouseEvents.push({
            type: 'click',
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
          });
        });
      });

      await page.goto('data:text/html,<html><body><h1>Mouse Test Page</h1><p>Testing mouse movements...</p></body></html>');

      // Simulate mouse movements
      const movements = [
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        { x: 500, y: 150 },
        { x: 200, y: 400 }
      ];

      for (const target of movements) {
        await page.mouse.move(target.x, target.y, { steps: 10 });
        await this.delay(500);
        await page.mouse.click(target.x, target.y);
        await this.delay(300);
      }

      // Analyze mouse behavior
      const mouseAnalysis = await page.evaluate(() => {
        if (!window.mouseEvents || window.mouseEvents.length === 0) {
          return { error: 'No mouse events captured' };
        }

        const events = window.mouseEvents;
        const moveEvents = events.filter(e => e.type === 'move');
        const clickEvents = events.filter(e => e.type === 'click');

        // Calculate movement smoothness
        let totalDistance = 0;
        let maxSpeed = 0;
        let minSpeed = Infinity;

        for (let i = 1; i < moveEvents.length; i++) {
          const prev = moveEvents[i - 1];
          const curr = moveEvents[i];
          const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
          const time = curr.timestamp - prev.timestamp;
          const speed = time > 0 ? distance / time : 0;

          totalDistance += distance;
          if (speed > maxSpeed) maxSpeed = speed;
          if (speed < minSpeed) minSpeed = speed;
        }

        return {
          totalEvents: events.length,
          moveEvents: moveEvents.length,
          clickEvents: clickEvents.length,
          totalDistance: Math.round(totalDistance),
          avgSpeed: totalDistance / (moveEvents.length > 1 ? moveEvents.length - 1 : 1),
          maxSpeed: maxSpeed,
          minSpeed: minSpeed,
          speedVariation: maxSpeed - minSpeed,
          humanLikeScore: Math.min(100, Math.max(0, 100 - (Math.abs(maxSpeed - minSpeed) / 10)))
        };
      });

      testResult.details = mouseAnalysis;

      if (mouseAnalysis.error) {
        testResult.status = 'failed';
      } else if (mouseAnalysis.humanLikeScore > 70) {
        testResult.status = 'passed';
      } else {
        testResult.status = 'warning';
      }

      console.log(`    Mouse events captured: ${mouseAnalysis.totalEvents || 0}`);
      console.log(`    Human-like score: ${mouseAnalysis.humanLikeScore || 0}/100`);

      await browser.disconnect();
      chromeProcess.kill();

    } catch (error) {
      testResult.status = 'error';
      testResult.error = error.message;
      console.log(`    Mouse test: ERROR - ${error.message}`);
    }

    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - testResult.startTime;

    return testResult;
  }

  async testNetworkTiming() {
    console.log('\n🌐 Testing Network Timing Patterns...');

    const testResult = {
      name: 'Network Timing Test',
      status: 'running',
      startTime: Date.now(),
      details: {}
    };

    try {
      const timings = [];
      const testUrls = [
        'https://httpbin.org/delay/1',
        'https://httpbin.org/delay/2',
        'https://httpbin.org/get'
      ];

      for (const url of testUrls) {
        const start = Date.now();
        try {
          const response = await fetch(url);
          const end = Date.now();
          timings.push({
            url: url,
            duration: end - start,
            status: response.status
          });
          console.log(`    ${url}: ${end - start}ms`);
        } catch (e) {
          timings.push({
            url: url,
            error: e.message
          });
        }

        // Random delay between requests (human-like)
        await this.delay(Math.random() * 2000 + 1000);
      }

      testResult.details.timings = timings;
      testResult.details.avgDelay = timings.reduce((sum, t) => sum + (t.duration || 0), 0) / timings.length;

      // Analyze timing patterns
      const delays = timings.map(t => t.duration).filter(d => d);
      const variation = Math.max(...delays) - Math.min(...delays);

      testResult.details.variation = variation;
      testResult.status = variation > 500 ? 'passed' : 'warning'; // Good variation indicates human-like timing

      console.log(`    Average response time: ${testResult.details.avgDelay.toFixed(2)}ms`);
      console.log(`    Timing variation: ${variation}ms`);

    } catch (error) {
      testResult.status = 'error';
      testResult.error = error.message;
      console.log(`    Network timing test: ERROR - ${error.message}`);
    }

    testResult.endTime = Date.now();
    testResult.duration = testResult.endTime - testResult.startTime;

    return testResult;
  }

  async runComprehensiveTest() {
    console.log('🧪 Starting Comprehensive Bypass Testing Suite\n');
    console.log('=' * 60);

    await this.initializeLogging();

    // Detect environment
    this.testResults.environment.chrome = await this.detectChromeVersion();
    console.log(`Environment: Node ${this.testResults.environment.nodeVersion}, Chrome ${this.testResults.environment.chrome}`);

    // Run all tests
    const tests = [
      () => this.testFingerprinting(),
      () => this.testCloudflareBypass(),
      () => this.testMouseBehavior(),
      () => this.testNetworkTiming()
    ];

    for (const test of tests) {
      try {
        const result = await test();
        this.testResults.tests.push(result);
        this.testResults.summary.total++;

        if (result.status === 'passed') {
          this.testResults.summary.passed++;
        } else {
          this.testResults.summary.failed++;
        }
      } catch (error) {
        console.error('Test execution error:', error);
        this.testResults.tests.push({
          name: 'Unknown Test',
          status: 'error',
          error: error.message
        });
        this.testResults.summary.total++;
        this.testResults.summary.failed++;
      }
    }

    // Calculate success rate
    this.testResults.summary.successRate =
      (this.testResults.summary.passed / this.testResults.summary.total) * 100;

    await this.generateReport();
    this.displaySummary();

    return this.testResults;
  }

  async generateReport() {
    try {
      const reportPath = path.join(this.logDir, `bypass-test-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (e) {
      console.warn('⚠️ Failed to save report:', e.message);
    }
  }

  displaySummary() {
    console.log('\n' + '=' * 60);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`Passed: ${this.testResults.summary.passed} ✓`);
    console.log(`Failed: ${this.testResults.summary.failed} ✗`);
    console.log(`Success Rate: ${this.testResults.summary.successRate.toFixed(1)}%`);

    console.log('\n📋 Individual Test Results:');
    this.testResults.tests.forEach(test => {
      const status = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '⚠️';
      console.log(`  ${status} ${test.name}: ${test.status.toUpperCase()}`);
      if (test.duration) {
        console.log(`    Duration: ${test.duration}ms`);
      }
      if (test.error) {
        console.log(`    Error: ${test.error}`);
      }
    });

    console.log('\n🎯 Recommendations:');

    if (this.testResults.summary.successRate < 70) {
      console.log('  ⚠️ Low success rate detected. Consider:');
      console.log('     - Using residential proxies');
      console.log('     - Implementing more behavioral patterns');
      console.log('     - Updating Chrome version');
      console.log('     - Adding more fingerprinting protections');
    } else if (this.testResults.summary.successRate < 90) {
      console.log('  📈 Good success rate. Minor improvements possible:');
      console.log('     - Fine-tune timing patterns');
      console.log('     - Enhance mouse movement realism');
      console.log('     - Add proxy rotation');
    } else {
      console.log('  ✨ Excellent success rate! Bypass is performing well.');
      console.log('     - Continue monitoring for Cloudflare updates');
      console.log('     - Consider load balancing for scale');
    }

    console.log('\n' + '=' * 60);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
async function main() {
  const suite = new BypassTestingSuite();

  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Bypass Testing Suite Usage:');
    console.log('  node bypass-testing-suite.js              # Run all tests');
    console.log('  node bypass-testing-suite.js --fingerprint # Test fingerprinting only');
    console.log('  node bypass-testing-suite.js --bypass      # Test Cloudflare bypass only');
    console.log('  node bypass-testing-suite.js --mouse       # Test mouse behavior only');
    console.log('  node bypass-testing-suite.js --network     # Test network timing only');
    return;
  }

  if (args.includes('--fingerprint')) {
    const result = await suite.testFingerprinting();
    console.log('Fingerprinting test result:', result);
  } else if (args.includes('--bypass')) {
    const result = await suite.testCloudflareBypass();
    console.log('Bypass test result:', result);
  } else if (args.includes('--mouse')) {
    const result = await suite.testMouseBehavior();
    console.log('Mouse behavior test result:', result);
  } else if (args.includes('--network')) {
    const result = await suite.testNetworkTiming();
    console.log('Network timing test result:', result);
  } else {
    // Run comprehensive test
    const results = await suite.runComprehensiveTest();
    process.exit(results.summary.successRate >= 70 ? 0 : 1);
  }
}

module.exports = BypassTestingSuite;

if (require.main === module) {
  main().catch(error => {
    console.error('Testing suite error:', error);
    process.exit(1);
  });
}