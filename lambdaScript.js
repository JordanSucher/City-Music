const axios = require('axios');
const pullShows = require('./pullShows');
const { getTokenFromRefresh, updateTracksDb, clearPlaylist, updatePlaylist } = require('./spotify');
const { db } = require('./server/db');

exports.handler = async (event, context) => {
    try{
        // Sync db
        await db.sync();

        // Pull upcoming shows from OMR and insert into DB
        console.log(`Pulling shows`);
        await pullShows();
        console.log('Done pulling shows');

        // Refresh playlist

        // Refresh Spotify token
        console.log('Refreshing Spotify token');
        const token = await getTokenFromRefresh();
        console.log('Done refreshing Spotify token');

        // Get artists' top tracks + insert into DB
        console.log(`Updating tracks db`);
        await updateTracksDb(token);
        console.log('Done updating tracks db');

        // Clear playlist
        console.log(`Clearing playlist`);
        await clearPlaylist(token);
        console.log('Done clearing playlist');

        // Update playlist
        console.log(`Updating playlist`);
        await updatePlaylist(token);
        console.log('Done updating playlist');

    } catch(e){
        console.log(e);
        throw e; // Ensure the error is thrown so AWS Lambda is aware of the failure
    }
};