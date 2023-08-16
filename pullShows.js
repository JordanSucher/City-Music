let axios = require('axios');
let sequelize = require('sequelize');
const {db, Show, Band} = require('./server/db');
const getOmrToken = require('./getOmrToken');

let startDate = new Date();
startDate = startDate.toLocaleDateString();
startDate = startDate.replaceAll("/","-")
// console.log(startDate);

let endDate = new Date();
endDate.setDate (endDate.getDate() + 7);
endDate = endDate.toLocaleDateString();
endDate = endDate.replaceAll("/","-")
// console.log(endDate);



const url = `https://www.ohmyrockness.com/api/shows.json?daterange%5Bfrom%5D=${startDate}&daterange%5Buntil%5D=${endDate}&index=true&per=300&regioned=1`

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
    t = await db.transaction();


    for (const show of shows) {
      try {
        //create a show row
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
          console.log(newShow.dataValues);

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
      } catch (err) {
        console.error('Error occurred:', err);
      }
    }

    await t.commit();
    console.log('changes committed')

  } catch (err) {
    if (t) await t.rollback();
    console.error('Error occurred:', err);
  }
}

module.exports = pullShows

