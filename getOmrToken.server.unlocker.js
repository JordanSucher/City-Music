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
    const response = await axios.post(UNLOCKER_CONFIG.apiUrl, {
      zone: UNLOCKER_CONFIG.zoneName,
      url: targetUrl,
      format: 'raw', // Get raw HTML content
      country: 'US', // Use US residential IPs
      render: true   // Enable JavaScript rendering
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${UNLOCKER_CONFIG.apiToken}`
      },
      timeout: 60000
    });

    console.log('✅ Web Unlocker API response received');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Content length: ${response.data.length}`);

    // Look for API calls in the HTML or make direct API call
    const htmlContent = response.data;

    // Try to extract auth token from HTML/scripts
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
          format: 'raw',
          country: 'US'
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
          country: 'US',
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
      console.log('📄 Error response:', error.response.data.substring(0, 200));
    }
    console.log('🔧 Config used:', {
      apiUrl: UNLOCKER_CONFIG.apiUrl,
      zoneName: UNLOCKER_CONFIG.zoneName,
      apiToken: UNLOCKER_CONFIG.apiToken ? UNLOCKER_CONFIG.apiToken.substring(0, 10) + '...' : 'undefined'
    });
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