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

    // Web Unlocker API request - CORRECT format
    const targetUrl = 'https://www.ohmyrockness.com/shows?all=true';

    console.log('📡 Making Web Unlocker API request...');

    // Web Unlocker API request with required parameters
    const requestPayload = {
      zone: UNLOCKER_CONFIG.zoneName,
      url: targetUrl,
      format: 'raw' // REQUIRED parameter
    };

    console.log('🔧 Request payload:', JSON.stringify(requestPayload, null, 2));

    const response = await axios.post(UNLOCKER_CONFIG.apiUrl, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
      },
      timeout: 60000
    });

    console.log('✅ Web Unlocker API response received');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Content length: ${response.data ? response.data.length : 0}`);
    console.log(`🔍 Response type: ${typeof response.data}`);

    // Debug: Show response structure
    if (response.data) {
      console.log('📋 Response keys:', Object.keys(response.data || {}));
      console.log('🔍 First 500 chars of response:', JSON.stringify(response.data).substring(0, 500));
    }

    // Handle different Web Unlocker response formats
    let htmlContent = '';

    if (typeof response.data === 'string') {
      htmlContent = response.data;
    } else if (response.data && response.data.body) {
      // Some Web Unlocker responses have a 'body' field
      htmlContent = response.data.body;
    } else if (response.data && response.data.content) {
      // Or 'content' field
      htmlContent = response.data.content;
    } else {
      console.log('⚠️ Unexpected response format from Web Unlocker');
    }

    if (!htmlContent) {
      console.log('❌ No HTML content received from Web Unlocker');
      console.log('📋 Full response:', JSON.stringify(response.data, null, 2));
    }

    // Try to extract auth token from HTML/scripts
    if (htmlContent) {
      const tokenPatterns = [
        /authorization['":\s]*["']([^"']+)["']/gi,
        /x-auth-token['":\s]*["']([^"']+)["']/gi,
        /bearer['":\s]*["']([^"']+)["']/gi,
        /token['":\s]*["']([^"']+)["']/gi
      ];

      for (const pattern of tokenPatterns) {
        const matches = htmlContent.match(pattern);
        if (matches && matches.length > 0) {
          // Extract the actual token value
          const tokenMatch = matches[0].match(/["']([^"']+)["']/);
          if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 10) {
            auth = tokenMatch[1];
            console.log('🔑 Token found in HTML:', auth.substring(0, 20) + '...');
            break;
          }
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
          format: 'raw'
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
          },
          timeout: 30000
        });

        console.log('🎉 Direct API call through Web Unlocker successful!');

        // Web Unlocker returns raw response, try to parse as JSON
        let apiData;
        try {
          apiData = JSON.parse(apiResponse.data);
          console.log(`📊 Got ${apiData.length} shows`);
        } catch (parseError) {
          console.log('📄 Response is not JSON, might be HTML with error');
          console.log('First 200 chars:', apiResponse.data.substring(0, 200));
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
          format: 'raw',
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
          timeout: 30000
        });

        console.log('🎉 Authenticated API call through Web Unlocker successful!');

        // Parse the API response
        let apiData;
        try {
          apiData = JSON.parse(apiResponse.data);
          console.log(`📊 Got ${apiData.length} shows`);
        } catch (parseError) {
          console.log('📄 Response is not JSON');
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