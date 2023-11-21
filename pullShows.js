let axios = require('axios');
let sequelize = require('sequelize');
const {db, Show, Band} = require('./server/db');
const getOmrToken = require('./getOmrToken');

let startDate = new Date();
startDate = startDate.toLocaleDateString();
startDate = startDate.replaceAll("/","-")

let endDate = new Date();
endDate.setDate (endDate.getDate() + 7);
endDate = endDate.toLocaleDateString();
endDate = endDate.replaceAll("/","-")



const url = `https://www.ohmyrockness.com/api/shows.json?daterange%5Bfrom%5D=${startDate}&daterange%5Buntil%5D=${endDate}&index=true&per=500&regioned=1`

let shows;

const pullShows = async function() {
  let t
  try {

    const omrToken = await getOmrToken();
   
    const response = await axios.get(url, {
      headers: {
        Authorization: omrToken
      }
    });
    
    const shows = response.data;

    for (const show of shows) {
      let t 
      try {
        t = await db.transaction();
        //create a show row
        console.log("adding show: " + show.id)
        let [newShow, created] = await Show.upsert(
         {
            omr_id: show.id,
            ticket_url: show.tickets_url,
            venue_name: show.venue.name,
            date: show.starts_at
          },
          {
            returning: true, // Return the created/updated row
            transaction: t
          }
        );
          console.log("successfully added show: " + show.id);

        //grab the bands
        const bands = show.cached_bands;
    
        //find or create and set an association
        for (const band of bands) {
          const [newBand, created] = await Band.upsert({
              name: band.name
            },
            {
              returning: true, // Return the created/updated row
              transaction: t
            }
          );
          //set association
          if (newShow && newBand) await newShow.addBand(newBand, { transaction: t });
        }

        await t.commit();
        console.log('changes committed for show: ' + show.id)

      } catch (err) {
        console.error('Error occurred:', err, err.message);
        if (t) await t.rollback();
      }
    }

  } catch (err) {
    if (t) await t.rollback();
    console.error('Error occurred:', err);
  }
}

module.exports = pullShows

