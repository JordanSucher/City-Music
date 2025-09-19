require('dotenv').config();
const axios = require('axios');

let auth = null;

// Bright Data Browser API Configuration
const BROWSER_CONFIG = {
  endpoint: 'https://api.brightdata.com/sessions',
  apiToken: process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHTDATA_PASS,
  zone: process.env.BRIGHTDATA_ZONE_NAME || 'web_unlocker1'
};

const getOmrToken = async () => {
  auth = null;
  let sessionId = null;

  try {
    console.log('🌐 Using Bright Data Browser API...');
    console.log(`🔗 Endpoint: ${BROWSER_CONFIG.endpoint}`);
    console.log(`🏷️ Zone: ${BROWSER_CONFIG.zone}`);

    // Step 1: Create browser session
    console.log('🚀 Creating browser session...');
    const sessionResponse = await axios.post(`${BROWSER_CONFIG.endpoint}`, {
      zone: BROWSER_CONFIG.zone,
      browser_type: 'chrome',
      viewport: { width: 1920, height: 1080 },
      country: 'US',
      timeout: 300000 // 5 minutes
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
      },
      timeout: 30000
    });

    sessionId = sessionResponse.data.session_id;
    console.log(`✅ Browser session created: ${sessionId}`);

    // Step 2: Navigate to target page
    console.log('🎯 Navigating to target page...');
    const targetUrl = 'https://www.ohmyrockness.com/shows?all=true';

    const navigateResponse = await axios.post(`${BROWSER_CONFIG.endpoint}/${sessionId}/navigate`, {
      url: targetUrl,
      wait_for: 'networkidle' // Wait for network requests to finish
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
      },
      timeout: 120000
    });

    console.log('✅ Navigation completed');
    console.log(`📊 Status: ${navigateResponse.data.status_code}`);

    // Step 3: Wait for page to fully load and handle Cloudflare
    console.log('⏳ Waiting for Cloudflare challenges to resolve...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // Step 4: Get page content
    console.log('📄 Getting page content...');
    const contentResponse = await axios.get(`${BROWSER_CONFIG.endpoint}/${sessionId}/content`, {
      headers: {
        'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
      },
      timeout: 30000
    });

    const htmlContent = contentResponse.data.content;
    console.log(`📏 HTML Content length: ${htmlContent.length}`);

    // Step 5: Monitor network requests
    console.log('🌐 Getting network requests...');
    const networkResponse = await axios.get(`${BROWSER_CONFIG.endpoint}/${sessionId}/requests`, {
      headers: {
        'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
      },
      timeout: 30000
    });

    const requests = networkResponse.data.requests || [];
    console.log(`📡 Network requests captured: ${requests.length}`);

    // Look for API calls and auth tokens
    const apiRequests = requests.filter(req =>
      req.url.includes('/api/') ||
      req.url.includes('shows.json')
    );

    console.log(`🔍 API requests found: ${apiRequests.length}`);

    // Extract auth tokens from request headers
    for (const apiReq of apiRequests) {
      console.log(`📡 API Request: ${apiReq.method} ${apiReq.url}`);

      const headers = apiReq.headers || {};
      for (const [headerName, headerValue] of Object.entries(headers)) {
        if (headerName.toLowerCase().includes('authorization') ||
            headerName.toLowerCase().includes('auth') ||
            headerName.toLowerCase().includes('token')) {
          auth = headerValue;
          console.log(`🔑 Found auth header '${headerName}': ${auth.substring(0, 30)}...`);
          break;
        }
      }

      if (auth) break;
    }

    // If no token found in headers, try making direct API call through browser
    if (!auth && requests.length > 0) {
      console.log('🔍 No auth token found, trying direct API call through browser...');

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

      // Execute API call in browser context
      const apiResponse = await axios.post(`${BROWSER_CONFIG.endpoint}/${sessionId}/execute`, {
        script: `
          return fetch('${apiUrl}', {
            headers: {
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Referer': window.location.href
            }
          }).then(response => response.json());
        `
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
        },
        timeout: 60000
      });

      if (apiResponse.data && apiResponse.data.result && Array.isArray(apiResponse.data.result)) {
        console.log(`🎉 Direct API call successful! Got ${apiResponse.data.result.length} shows`);

        return {
          token: 'browser-direct-access',
          apiData: {
            success: true,
            data: apiResponse.data.result
          }
        };
      }
    }

    // If we found a token, test it
    if (auth) {
      console.log('🔑 Testing extracted auth token...');

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

      // Test the token with authenticated API call
      const testResponse = await axios.post(`${BROWSER_CONFIG.endpoint}/${sessionId}/execute`, {
        script: `
          return fetch('${apiUrl}', {
            headers: {
              'Authorization': '${auth}',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Referer': window.location.href
            }
          }).then(response => response.json());
        `
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
        },
        timeout: 60000
      });

      if (testResponse.data && testResponse.data.result && Array.isArray(testResponse.data.result)) {
        console.log(`🎉 Authenticated API call successful! Got ${testResponse.data.result.length} shows`);

        return {
          token: auth,
          apiData: {
            success: true,
            data: testResponse.data.result
          }
        };
      }
    }

    console.log('🔐 Final auth token:', auth || 'Not found');
    return {
      token: auth,
      apiData: auth ? { success: false, error: 'Token found but API call failed' } : null
    };

  } catch (error) {
    console.log('💥 Browser API error:', error.response?.status || error.message);
    if (error.response?.data) {
      const errorData = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
      console.log('📄 Error response:', errorData.substring(0, 500));
    }
    return null;
  } finally {
    // Clean up: Close browser session
    if (sessionId) {
      try {
        console.log('🧹 Closing browser session...');
        await axios.delete(`${BROWSER_CONFIG.endpoint}/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${BROWSER_CONFIG.apiToken}`
          },
          timeout: 10000
        });
        console.log('✅ Browser session closed');
      } catch (cleanupError) {
        console.log('⚠️ Failed to close browser session:', cleanupError.message);
      }
    }
  }
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Browser API result:', result);
  })();
}

module.exports = getOmrToken;