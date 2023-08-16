const axios = require('axios');
const qs = require('qs');
const {Track, Band, Show} = require('./server/db');
const Bottleneck = require("bottleneck");
const Sequelize = require('sequelize');

const limiter = new Bottleneck({
    minTime: 1000, // Ensure at least 1000ms between each job
    maxConcurrent: 20, // Only one request at a time
    reservoir: 20, // Start with 5 available jobs
    reservoirRefreshAmount: 20, // Add 5 jobs every 60 seconds
    reservoirRefreshInterval: 2000, // Must be in milliseconds
    retryLimit: 3, // Retry failed jobs 3 times
    retryDelay: 1000 // Wait for 1000ms before retrying
})


//get an access token

let clientId = process.env.SPOTIFY_CLIENT
let secret = process.env.SPOTIFY_SECRET

let unencoded = {
    'grant_type': 'client_credentials',
    'client_id':clientId,
    'client_secret': secret
}
let encoded = qs.stringify(unencoded)
let tokenUrl = `https://accounts.spotify.com/api/token`

const getToken = async () => {
    try {
        const {data} = await axios.post(tokenUrl, encoded, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        return data.access_token
    } catch (e) {
        console.log(e)
    }
}

const getTokenFromRefresh = async () => {
    let clientId = process.env.SPOTIFY_CLIENT
    let secret = process.env.SPOTIFY_SECRET
    let refresh = process.env.SPOTIFY_REFRESH

    let unencoded = {
        'grant_type': 'refresh_token',
        'refresh_token':refresh,
    }
    let encoded = qs.stringify(unencoded)
    let tokenUrl = `https://accounts.spotify.com/api/token`
    let token
    
        try {
            const {data} = await axios.post(tokenUrl, encoded, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64')
                }
            })
            token = data.access_token
            return token
        } catch (e) {
            console.log(e)
        }
    }


// get the artist ID
//we want response.artists.items[0].id

const getId = async (bandName, token, band) => {

    let artistName = bandName.replaceAll(" ", "+")
    // console.log(artistName)
    let searchURL = `https://api.spotify.com/v1/search?q=${artistName}&type=artist`

    // let token = await getToken();
    try {
        const {data} = await axios.get(searchURL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        
        if(data.artists.items.length > 0) {
            
            try{
                // console.log (`upserting ${bandName}`)
                // console.log(data.artists.items[0].id)
                await Band.upsert ({
                    id: band.id,
                    name: bandName,
                    spotify_id: data.artists.items[0].id
                })
                return data.artists.items[0].id
            } catch (e) {
                console.log(e)
            }

        } else {
            // console.log(
            //     `No artists found for ${bandName}`
            // )
        }
    } catch (e) {
        console.log(e)
    }
    }

//get top tracks

const getTopTracks = async (bandName, token, band) => {
    try {
        let id = await getId(bandName, token, band)
        // console.log(id)

        if (id!== undefined) {
            let topTracksURL = `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`
            const {data} = await axios.get(topTracksURL, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return data.tracks
        } else {
            return []
        }
    } catch (e) {
        console.log(e)
    }
}

// insert tracks into db

const insertTracks = async (tracks, numToAdd, band) => {
    // console.log(tracks)
    for (let i = 0; i < numToAdd; i++) {
        if (tracks[i]) {
            try{
                // console.log(`upserting ${tracks[i].name}`)
                const newTrack = await Track.upsert(
                {
                    name: tracks[i].name,
                    spotify_uri: tracks[i].uri,
                    bandId: band.id
                }
            )} catch (e) {
                console.log(e)
            }

            }
    }
}

// now i have a bunch of helper functions, and I need to iterate through the artists and add tracks. Ideally I build this such that it only runs for artists without tracks in the db.

//get artists who don't have tracks

const getArtistsWithoutTracks = async () => {
    const bandsWithoutTracks = await Band.findAll({
        include: [{
            model: Track,
            as: 'tracks',
            required: false // this makes the join a LEFT JOIN instead of an INNER JOIN
        }],
        where: {
            '$tracks.id$': null // tracks that don't exist will have null IDs
        }
    });

    return bandsWithoutTracks

}

//one master fn to get relevant artists, grab their top tracks, insert them into the db

const updateTracksDb = async (token) => {
    const bandsWithoutTracks = await getArtistsWithoutTracks()
    // const token = await getToken()

    //for each band, get top tracks and insert them
    const processBand = async (band) => {
        const tracks = await getTopTracks(band.name, token, band)
        if (tracks.length >0) await insertTracks(tracks, 2, band)
    }

    const promises = bandsWithoutTracks.map(band => {
        return limiter.schedule(()=>processBand(band)).
        // then(() => console.log(band.name)).
        catch(e => console.log(e))
    })

    await Promise.all(promises)
}


//clear the playlist

const clearPlaylist = async (token) => {
    const playlistId = process.env.PLAYLIST_ID
    let length = 1

    while (length > 0) {
        //get snapshot ID, current length
        let tracks
        let snapshotId
        try {
            let {data} = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            snapshotId = data.snapshot_id
            length = data.tracks.total;
            tracks = data.tracks

        } catch (e) {
            console.log(e)
        }

        //construct a delete request
        const body = {
            "tracks": tracks.items.map(track => {
                return {
                    "uri": track.track.uri
                }
            }),
            "snapshot_id": snapshotId
        }


        //delete items
        try{
            await axios.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                data: body,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                
            })
        } catch (e) {
            console.log(e)
        }
    }

    return true
}

//update playlist

const updatePlaylist = async (token) => {
    
    //get bands playing in the next 7 days;
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const upcomingShows = await Show.findAll({
        where: {
            date: {
            [Sequelize.Op.lte]: oneWeekFromNow,
            [Sequelize.Op.gte]: new Date()
            }
        },
        include: [
            {
            model: Band
            }
        ]
        });

    // Extract the bands from the shows
    const bands = upcomingShows.flatMap(show => show.bands);

    // Then, for each band, find all the tracks
    const allTracks = [];
    for (let band of bands) {
    const tracks = await Track.findAll({
        where: {
        bandId: band.id
        }
    });
    allTracks.push(...tracks);
    }

    // add the tracks to the playlist
    while (allTracks.length > 0) {
        //get the first 50 tracks
        const first50 = allTracks.splice(0, 50);

        //construct an api call
        const playlistId = process.env.PLAYLIST_ID
        const body = {
            "uris": first50.map(track => {
                return track.get('spotify_uri')
            })
        }
        
        try{
            await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, body, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                
            })
        } catch (e) {
            console.log(e)
        }

    }

    return true

}





module.exports = {
    updateTracksDb,
    clearPlaylist,
    updatePlaylist,
    getTokenFromRefresh


}