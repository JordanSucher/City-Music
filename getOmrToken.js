const puppeteer = require("puppeteer");
let auth


const getOmrToken = async () => {

  try {

    const browser = await puppeteer.launch();


    const page = await browser.newPage();
    
    // attach to the 'request' event to log all network requests
    page.on('request', request => {
      let url = request.url()
      if (url.includes('ohmyrockness.com/api/shows.json?')) {
        auth = request.headers()['authorization'] 
      }
    });
    
    await page.goto('https://www.ohmyrockness.com/shows?all=true');
    
    await browser.close();
    console.log(auth) 
    return auth
  } catch (e) {
    console.log(e, e.message)
  }
  }

// const getToken = async () => {
//   let token = await getOmrToken()  
//  console.log(token)
// }

// getToken()

  module.exports = getOmrToken
  