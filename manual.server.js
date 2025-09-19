const pullShows = require('./pullShows.server.js');
const { getTokenFromRefresh, updateTracksDb, clearPlaylist, updatePlaylist } = require('./spotify.js');
const prisma = require('./prisma/prismaClient.js');

const main = async () => {
    try {
        // Pull upcoming shows from OMR and insert into DB
        console.log(`Pulling shows (server version)`);
        await pullShows();
        console.log('Done pulling shows');

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

        console.log('All tasks completed successfully!');
    } catch (error) {
        console.error('Error in main function:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

main().catch(console.error);