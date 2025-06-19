let axios = require('axios');
const prisma = require('./prisma/prismaClient.js');

const getOmrToken = require('./getOmrToken');

let startDate = new Date();
startDate = startDate.toLocaleDateString();
startDate = startDate.replaceAll("/","-")

let endDate = new Date();
endDate.setDate (endDate.getDate() + 7);
endDate = endDate.toLocaleDateString();
endDate = endDate.replaceAll("/","-")



const url = `https://www.ohmyrockness.com/api/shows.json?daterange%5Bfrom%5D=${startDate}&daterange%5Buntil%5D=${endDate}&index=true&per=500&regioned=1`

const proxyConfig = {
  host: 'brd.superproxy.io',
  port: 22225,
  auth: {
    username: 'brd-customer-hl_ca6e7f6e-zone-residential_proxy1',  // optional if your proxy requires authentication
    password: 'zgj0b5o9vcn5'   // optional if your proxy requires authentication
  }
};

let shows;

const pullShows = async function() {
  try {
    console.log("getting omr token");
    const omrToken = await getOmrToken();
    console.log("got token, pulling shows from omr");
    const response = await axios.get(url, {
      headers: { Authorization: omrToken}
    });
    const shows = response.data;

    for (const show of shows) {
      try {
        const result = await prisma.$transaction(async (prisma) => {
          console.log("adding show: " + show.id);

          const newShow = await prisma.show.upsert({
            where: { omr_id: show.id },
            update: {
              ticket_url: show.tickets_url,
              venue_name: show.venue.name,
              latlong: `[${show.venue.latitude},${show.venue.longitude}]`,
              date: new Date(show.starts_at),
            },
            create: {
              omr_id: show.id,
              ticket_url: show.tickets_url,
              venue_name: show.venue.name,
              latlong: `[${show.venue.latitude},${show.venue.longitude}]`,
              date: new Date(show.starts_at),
            },
          });

          console.log("successfully added show: " + show.id);
          console.log("show obj: " + newShow.id, newShow.omr_id);

          const bands = show.cached_bands;

          for (const band of bands) {
            const newBand = await prisma.band.upsert({
              where: { name: band.name },
              update: {},
              create: { name: band.name },
            });

            console.log("band added: " + newBand.id, newBand.name);

            // Add relationship in the join table BandShow
            await prisma.bandShow.upsert({
              where: {
                bandId_showId: {
                  bandId: newBand.id,
                  showId: newShow.id,
                },
              },
              update: {},
              create: {
                bandId: newBand.id,
                showId: newShow.id,
              },
            });
          }
        });

        console.log('Transaction committed for show:', show.id);
      } catch (err) {
        console.error('Transaction failed for show:', show.id, 'Error:', err.message);
        continue 
        // Rethrow or handle as needed
      }
    }

  } catch (err) {
    console.error("Error:", err, err.response ? err.response.data : err.message);
  }
};

module.exports = pullShows


// let getShows = ()=>{
//   pullShows()
// }

// getShows()
