require('dotenv').config();
const axios = require('axios');

let auth = null;

// Bright Data API Configuration - try multiple endpoints
const PROXY_ENDPOINTS = [
  // Try Unlocker endpoint first
  process.env.BRIGHTDATA_HOST + ':' + (process.env.BRIGHTDATA_PORT || '22225'),
  // Fallback to standard residential proxy endpoints
  'brd.superproxy.io:22225',
  'brd.superproxy.io:33335'
];

const UNLOCKER_CONFIG = {
  username: process.env.BRIGHTDATA_USER || 'brd-customer-hl_xxxxx-zone-residential',
  password: process.env.BRIGHTDATA_PASS || 'your_password_here',
  endpoints: PROXY_ENDPOINTS
};

const getOmrToken = async () => {
  auth = null;

  // Try each endpoint until one works
  for (const endpoint of UNLOCKER_CONFIG.endpoints) {
    try {
      console.log('🚀 Using Bright Data API...');
      console.log(`🌐 Trying endpoint: ${endpoint}`);

      // First request - get the main page and extract token
      const targetUrl = 'https://www.ohmyrockness.com/shows?all=true';

      console.log('📡 Making API request...');
      const response = await axios.get(targetUrl, {
        proxy: {
          protocol: 'http',
          host: endpoint.split(':')[0],
          port: parseInt(endpoint.split(':')[1]),
          auth: {
            username: UNLOCKER_CONFIG.username,
            password: UNLOCKER_CONFIG.password
          }
        },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      timeout: 60000,
      maxRedirects: 5
    });

    console.log('✅ Unlocker API response received');
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

    // If no token found, try making API call directly through Unlocker
    if (!auth) {
      console.log('🔍 No token in HTML, trying direct API call...');

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
        const apiResponse = await axios.get(apiUrl, {
          proxy: {
            protocol: 'http',
            host: UNLOCKER_CONFIG.endpoint.split(':')[0],
            port: parseInt(UNLOCKER_CONFIG.endpoint.split(':')[1]),
            auth: {
              username: UNLOCKER_CONFIG.username,
              password: UNLOCKER_CONFIG.password
            }
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.ohmyrockness.com/shows',
            'X-Requested-With': 'XMLHttpRequest',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
          },
          timeout: 30000
        });

        console.log('🎉 Direct API call successful!');
        console.log(`📊 Got ${apiResponse.data.length} shows`);

        return {
          token: 'direct-api-access',
          apiData: {
            success: true,
            data: apiResponse.data
          }
        };

      } catch (apiError) {
        console.log('❌ Direct API call failed:', apiError.response?.status || apiError.message);
      }
    }

    // If we found a token, try using it for API call
    if (auth) {
      console.log('🔑 Testing extracted token...');

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
        const apiResponse = await axios.get(apiUrl, {
          proxy: {
            protocol: 'http',
            host: UNLOCKER_CONFIG.endpoint.split(':')[0],
            port: parseInt(UNLOCKER_CONFIG.endpoint.split(':')[1]),
            auth: {
              username: UNLOCKER_CONFIG.username,
              password: UNLOCKER_CONFIG.password
            }
          },
          headers: {
            'Authorization': auth,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.ohmyrockness.com/shows',
            'X-Requested-With': 'XMLHttpRequest',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
          },
          timeout: 30000
        });

        console.log('🎉 Authenticated API call successful!');
        console.log(`📊 Got ${apiResponse.data.length} shows`);

        return {
          token: auth,
          apiData: {
            success: true,
            data: apiResponse.data
          }
        };

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
      console.log(`💥 Endpoint ${endpoint} failed:`, error.response?.status || error.message);
      if (error.response?.data) {
        console.log('📄 Error response:', error.response.data.substring(0, 200));
      }
      // Continue to next endpoint
      continue;
    }
  }

  // All endpoints failed
  console.log('❌ All endpoints failed');
  return null;
};

if (require.main === module) {
  (async () => {
    const result = await getOmrToken();
    console.log('🏁 Unlocker result:', result);
  })();
}

module.exports = getOmrToken;