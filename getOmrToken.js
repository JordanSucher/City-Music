const puppeteer = require('puppeteer');

let auth

const getOmrToken = async () => {

    let browserlessToken = process.env.BROWSERLESS_TOKEN

  try {
    const browser =   await puppeteer.connect(
      { browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}` }
    );

    const page = await browser.newPage();
    
    // attach to the 'request' event to log all network requests
    page.on('request', request => {
      let url = request.url()
      if (url.includes('ohmyrockness.com/api/shows.json?')) {
        auth = request.headers()['authorization'] 
      }
    });
  
    await page.goto('https://ohmyrockness.com/');
    
    await browser.close();

    return auth
  } catch (e) {
    console.log(e)
  }
  }

// const getToken = async () => {
//   let token = await getOmrToken()
//   console.log(token) 
// }

// getToken()

  module.exports = getOmrToken
  