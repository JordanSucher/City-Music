const pullShows = require('./pullShows.js');
const { getTokenFromRefresh, updateTracksDb, clearPlaylist, updatePlaylist } = require('./spotify.js');
const prisma = require('./prisma/prismaClient.js');

exports.handler = async (event, context) => {
    try{
    //     // Pull upcoming shows from OMR and insert into DB
    //     console.log(`Pulling shows`);
    //     await pullShows();
    //     console.log('Done pulling shows');

        // Refresh playlist

        // Refresh Spotify token
        console.log('Refreshing Spotify token');
        const token = await getTokenFromRefresh();
        console.log('Done refreshing Spotify token');

        // // Get artists' top tracks + insert into DB
        // console.log(`Updating tracks db`);
        // await updateTracksDb(token);
        // console.log('Done updating tracks db');

        // Clear playlist
        console.log(`Clearing playlist`);
        await clearPlaylist(token);
        console.log('Done clearing playlist');

        // Update playlist
        console.log(`Updating playlist`);
        await updatePlaylist(token);
        console.log('Done updating playlist');

        // Return success
        return true;

    } catch(e){
        console.error(e.stack, e.message);
        await prisma.$disconnect();
        throw e;
    }
};

exports.handler()
