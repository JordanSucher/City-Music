let axios = require('axios');
const prisma = require('./prisma/prismaClient.js');

const getOmrToken = require('./getOmrToken.server.realBrowser');

let startDate = new Date();
startDate = startDate.toLocaleDateString();
startDate = startDate.replaceAll("/","-")

let endDate = new Date();
endDate.setDate (endDate.getDate() + 7);
endDate = endDate.toLocaleDateString();
endDate = endDate.replaceAll("/","-")



const url = `https://www.ohmyrockness.com/api/shows.json?daterange%5Bfrom%5D=${startDate}&daterange%5Buntil%5D=${endDate}&index=true&per=500&regioned=1`

const pullShows = async function() {
  try {
    console.log("getting omr token and fetching shows (enhanced server version)");
    const result = await getOmrToken();

    if (!result || !result.apiData || !result.apiData.success) {
      console.error("Failed to get shows data:", result?.apiData?.error || "No data returned");
      return;
    }

    const shows = result.apiData.data;
    console.log(`Received ${shows.length} shows from API`);

    console.log("Starting to process shows...");
    for (const show of shows) {
      try {
        console.log(`Processing show ${show.id} - ${show.venue?.name}`);
        console.log(`Raw starts_at: ${show.starts_at}`);
        console.log(`Parsed date: ${new Date(show.starts_at)}`);
        console.log(`Parsed date ISO: ${new Date(show.starts_at).toISOString()}`);

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