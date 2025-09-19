require('dotenv').config();
const axios = require('axios');

let auth = null;

// Bright Data Web Unlocker API Configuration - CORRECT implementation
const UNLOCKER_CONFIG = {
  apiUrl: 'https://api.brightdata.com/request',
  // Web Unlocker uses API token, not proxy credentials
  apiToken: process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHTDATA_PASS, // fallback to existing creds for now
  zoneName: process.env.BRIGHTDATA_ZONE_NAME || 'web-unlocker' // Web Unlocker zone name
};

const getOmrToken = async () => {
  auth = null;

  try {
    console.log('🚀 Using Bright Data Web Unlocker API (CORRECT)...');
    console.log(`🌐 API Endpoint: ${UNLOCKER_CONFIG.apiUrl}`);
    console.log(`🏷️ Zone Name: ${UNLOCKER_CONFIG.zoneName}`);

    // Web Unlocker API request - Start with simpler URL
    const targetUrl = 'https://www.ohmyrockness.com/shows?all=true';

    console.log('🎯 Target URL:', targetUrl);

    console.log('📡 Making Web Unlocker API request...');

    // Web Unlocker API request with JSON format
    const requestPayload = {
      zone: UNLOCKER_CONFIG.zoneName,
      url: targetUrl,
      format: 'json' // JSON format might provide structured response with more metadata
    };

    console.log('🔧 Request payload:', JSON.stringify(requestPayload, null, 2));

    console.log('⏱️ Web Unlocker processing (may take up to 3 minutes for complex challenges)...');

    const response = await axios.post(UNLOCKER_CONFIG.apiUrl, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
      },
      timeout: 180000 // 3 minutes - Web Unlocker can take time for complex Cloudflare challenges
    });

    console.log('✅ Web Unlocker JSON response received');
    console.log(`📊 Status: ${response.status}`);
    console.log(`🔍 Response type: ${typeof response.data}`);

    // JSON format returns structured data
    let jsonData = null;
    let htmlContent = '';

    try {
      jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      console.log('📋 JSON structure:', Object.keys(jsonData || {}));
      console.log('🔍 JSON response preview:', JSON.stringify(jsonData, null, 2).substring(0, 1000));

      // Different possible structures for JSON format
      if (jsonData) {
        // Try to find HTML content in various JSON fields
        if (jsonData.body) {
          htmlContent = jsonData.body;
          console.log(`📏 HTML Content from body: ${htmlContent.length}`);
        } else if (jsonData.content) {
          htmlContent = jsonData.content;
          console.log(`📏 HTML Content from content: ${htmlContent.length}`);
        } else if (jsonData.html) {
          htmlContent = jsonData.html;
          console.log(`📏 HTML Content from html: ${htmlContent.length}`);
        } else if (jsonData.response) {
          htmlContent = jsonData.response;
          console.log(`📏 HTML Content from response: ${htmlContent.length}`);
        } else {
          // Maybe the whole response is HTML
          htmlContent = JSON.stringify(jsonData);
          console.log(`📏 HTML Content from full JSON: ${htmlContent.length}`);
        }

        // Look for any network/request data in JSON
        if (jsonData.requests || jsonData.network || jsonData.calls) {
          console.log('🌐 Found network data in JSON response');
          console.log('📡 Network data:', jsonData.requests || jsonData.network || jsonData.calls);
        }

        // Look for any auth/token data directly in JSON
        if (jsonData.auth || jsonData.token || jsonData.authorization) {
          auth = jsonData.auth || jsonData.token || jsonData.authorization;
          console.log(`🔑 Found auth in JSON: ${auth.substring(0, 30)}...`);
        }
      }

    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:', parseError.message);
      console.log('📄 Raw response preview:', JSON.stringify(response.data).substring(0, 500));
      // Try treating it as raw HTML
      htmlContent = response.data;
    }

    // Try to extract auth token from HTML/scripts with better patterns
    if (htmlContent) {
      console.log('🔍 Searching for authentication tokens in HTML...');

      // More specific patterns for actual tokens
      const tokenPatterns = [
        // Look for Authorization headers in JavaScript
        /['"]Authorization['"]:\s*['"]([^'"]{20,})['"]/,
        /Authorization:\s*['"]([^'"]{20,})['"]/,

        // Look for Bearer tokens
        /['"]Bearer\s+([^'"]{20,})['"]/,
        /bearer['":\s]+['"]([^'"]{20,})['"]/,

        // Look for API tokens in configs
        /['"]token['"]:\s*['"]([^'"]{20,})['"]/,
        /token['":\s]*['"]([^'"]{20,})['"]/,

        // Look for auth tokens in meta or script tags
        /auth[_-]?token['":\s]*['"]([^'"]{20,})['"]/,
        /api[_-]?key['":\s]*['"]([^'"]{20,})['"]/,

        // Look for JWT tokens
        /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,

        // Look for session or access tokens
        /access[_-]?token['":\s]*['"]([^'"]{20,})['"]/,
        /session[_-]?token['":\s]*['"]([^'"]{20,})['"]/,
      ];

      for (const pattern of tokenPatterns) {
        const match = htmlContent.match(pattern);
        if (match) {
          // For JWT pattern, use the full match; for others, use capture group
          const token = pattern.source.includes('eyJ') ? match[0] : match[1];

          if (token && token.length > 15 && !token.includes('<') && !token.includes('>')) {
            auth = token;
            console.log('🔑 Token found in HTML:', auth.substring(0, 30) + '...');
            console.log('🎯 Token type:', pattern.source.substring(0, 50) + '...');
            break;
          }
        }
      }

      if (!auth) {
        console.log('❌ No valid authentication token found in HTML');
        console.log('🔍 Searching for common API patterns...');

        // Look for API endpoints that might reveal token structure
        const apiEndpoints = htmlContent.match(/\/api\/[^"'\s]+/g);
        if (apiEndpoints) {
          console.log('📡 Found API endpoints:', apiEndpoints.slice(0, 5));
        }

        // Look for authentication-related JavaScript
        const authJS = htmlContent.match(/fetch\([^)]+['"](\/api\/[^'"]+)['"]/g);
        if (authJS) {
          console.log('🔧 Found fetch calls to API:', authJS.slice(0, 3));
        }
      }
    }

    // If no token found, try making API call directly through Web Unlocker
    if (!auth) {
      console.log('🔍 No token in HTML, trying direct API call through Web Unlocker...');

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

      try {
        const apiResponse = await axios.post(UNLOCKER_CONFIG.apiUrl, {
          zone: UNLOCKER_CONFIG.zoneName,
          url: apiUrl,
          format: 'json'
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
          },
          timeout: 120000
        });

        console.log('🎉 Direct API call through Web Unlocker HAR successful!');

        // Parse HAR response to get API data
        let apiData;
        try {
          const harResponse = typeof apiResponse.data === 'string' ? JSON.parse(apiResponse.data) : apiResponse.data;

          if (harResponse.log && harResponse.log.entries) {
            // Find the API response in HAR entries
            const apiEntry = harResponse.log.entries.find(entry =>
              entry.request.url.includes('shows.json')
            );

            if (apiEntry && apiEntry.response && apiEntry.response.content) {
              const responseText = apiEntry.response.content.text;
              if (responseText) {
                apiData = JSON.parse(responseText);
                console.log(`📊 Got ${apiData.length} shows from HAR`);
              }
            }
          }

          if (!apiData) {
            console.log('❌ No API response found in HAR data');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse HAR API response:', parseError.message);
          apiData = null;
        }

        if (apiData && Array.isArray(apiData)) {
          return {
            token: 'web-unlocker-direct',
            apiData: {
              success: true,
              data: apiData
            }
          };
        }

      } catch (apiError) {
        console.log('❌ Direct API call failed:', apiError.response?.status || apiError.message);
      }
    }

    // If we found a token, try using it for API call through Web Unlocker
    if (auth) {
      console.log('🔑 Testing extracted token with Web Unlocker...');

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

      try {
        const apiResponse = await axios.post(UNLOCKER_CONFIG.apiUrl, {
          zone: UNLOCKER_CONFIG.zoneName,
          url: apiUrl,
          format: 'json',
          headers: {
            'Authorization': auth,
            'Referer': 'https://www.ohmyrockness.com/shows',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
          },
          timeout: 120000
        });

        console.log('🎉 Authenticated API call through Web Unlocker HAR successful!');

        // Parse the HAR API response
        let apiData;
        try {
          const harResponse = typeof apiResponse.data === 'string' ? JSON.parse(apiResponse.data) : apiResponse.data;

          if (harResponse.log && harResponse.log.entries) {
            // Find the API response in HAR entries
            const apiEntry = harResponse.log.entries.find(entry =>
              entry.request.url.includes('shows.json')
            );

            if (apiEntry && apiEntry.response && apiEntry.response.content) {
              const responseText = apiEntry.response.content.text;
              if (responseText) {
                apiData = JSON.parse(responseText);
                console.log(`📊 Got ${apiData.length} shows from authenticated HAR`);
              }
            }
          }

          if (!apiData) {
            console.log('❌ No authenticated API response found in HAR data');
          }
        } catch (parseError) {
          console.log('❌ Failed to parse authenticated HAR response:', parseError.message);
          apiData = null;
        }

        if (apiData && Array.isArray(apiData)) {
          return {
            token: auth,
            apiData: {
              success: true,
              data: apiData
            }
          };
        }

      } catch (authApiError) {
        console.log('❌ Authenticated API call failed:', authApiError.response?.status || authApiError.message);
      }
    }

    console.log('🔐 Final auth token:', auth || 'Not found');
    return {
      token: auth,
      apiData: auth ? { success: false, error: 'Token found but API call failed' } : null
    };

  } catch (error) {
    console.log('💥 Web Unlocker API error:', error.response?.status || error.message);
    if (error.response?.data) {
      const errorData = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
      console.log('📄 Error response:', errorData.substring(0, 500));
    }
    console.log('🔧 Config used:', {
      apiUrl: UNLOCKER_CONFIG.apiUrl,
      zoneName: UNLOCKER_CONFIG.zoneName,
      apiToken: UNLOCKER_CONFIG.apiToken ? UNLOCKER_CONFIG.apiToken.substring(0, 10) + '...' : 'undefined'
    });

    // 400 errors usually indicate invalid request format
    if (error.response?.status === 400) {
      console.log('🚨 400 Bad Request - This usually means:');
      console.log('  - Invalid zone name (should match your Web Unlocker zone exactly)');
      console.log('  - Wrong API token format');
      console.log('  - Missing required parameters');
      console.log('  - Zone type is not Web Unlocker (might be Residential Proxy instead)');
    }

    return null;
  }
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Unlocker result:', result);
  })();
}

module.exports = getOmrToken;