require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const Bottleneck = require("bottleneck");

const prisma = require('./prisma/prismaClient.js');


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
        console.log("data", data)
        return data
    } catch (e) {
        console.log(e)
    }
}

// getToken()

const getAuthUrl = () => {
    const scopes = 'playlist-modify-public playlist-modify-private';
    const redirectUri = 'http://localhost:3000/authorized'; // Use this one
    const clientId = process.env.SPOTIFY_CLIENT;
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    return authUrl;
};

// console.log(getAuthUrl())

// code = "AQD60BQD_EudKVXtwY2h3T5VhrrilBb9cSDYya2cSa5nm8r0l64c5fUOVmwm1f8a2YuToS3R-O7TT2XE0qNCvyMzKcY7H5BwnEbIKdGf6nc1syPa4Ajp71pWw-iQf8UxNihS-2YjjZvMVOPXzULxWQmnvKm3h3N_SzIV52S9WzX5-vGS-YUdelYFzaNndOta4gzhCLcdSnuDZuWU7_d4hhgqe97trRTi5P1cpuAIJZvengBRVw"

const getTokensFromCode = async (authCode) => {
    const clientId = process.env.SPOTIFY_CLIENT;
    const secret = process.env.SPOTIFY_SECRET;
    const redirectUri = 'http://localhost:3000/authorized'; // Same as above
    
    const body = {
        'grant_type': 'authorization_code',
        'code': authCode,
        'redirect_uri': redirectUri,
    };

    try {
        const { data } = await axios.post('https://accounts.spotify.com/api/token', 
            qs.stringify(body), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64')
            }
        });
        
        console.log('Refresh token:', data.refresh_token);
        return data;
    } catch (e) {
        console.log(e.response?.data || e);
    }
};

// getTokensFromCode(code)

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
    let artistName = bandName.replaceAll(" ", "+");
    let searchURL = `https://api.spotify.com/v1/search?q=${artistName}&type=artist`;

    try {
        const { data } = await axios.get(searchURL, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("data", data)

        if (data.artists.items.length > 0) {
            try {
                console.log(`Upserting ${bandName}`);
                console.log(data.artists.items[0].id);
                const updatedBand = await prisma.band.upsert({
                    where: {
                        id: band.id // Assuming 'id' is the unique identifier for 'Band'
                    },
                    update: {
                        spotify_id: data.artists.items[0].id
                    },
                    create: {
                        name: bandName,
                        spotify_id: data.artists.items[0].id
                    }
                });
                return data.artists.items[0].id;
            } catch (e) {
                console.error(`Error updating band: ${bandName}`, e);
            }
        } else {
            console.log(`No artists found for ${bandName}`);
        }
    } catch (e) {
        console.error(`Error fetching Spotify data for ${bandName}`, e);
    }
};


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
    for (let i = 0; i < numToAdd; i++) {
        if (tracks[i]) {
            try {
                console.log(`upserting ${tracks[i].name}`);
                const newTrack = await prisma.track.upsert({
                    where: {
                        // This assumes spotify_uri is a unique identifier for tracks
                        spotify_uri: tracks[i].uri,
                    },
                    update: {
                        // Assuming no fields are updated if the track already exists
                        name: tracks[i].name,
                        bandId: band.id,
                    },
                    create: {
                        name: tracks[i].name,
                        spotify_uri: tracks[i].uri,
                        preview_url: tracks[i].preview_url,
                        image_url: tracks[i].album.images[0].url,
                        bandId: band.id,
                    },
                });
            } catch (e) {
                console.error(e);
            }
        }
    }
};

// now i have a bunch of helper functions, and I need to iterate through the artists and add tracks. Ideally I build this such that it only runs for artists without tracks in the db.

//get artists who don't have tracks

const getArtistsWithoutTracks = async () => {
    const bandsWithoutTracks = await prisma.band.findMany({
        // Include tracks to show what tracks are associated, even though they are empty
        include: {
          tracks: true,
        },
        where: {
          // Condition to check that there are no tracks associated
          tracks: {
            none: {}
          }
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
        console.log("token", token)
        try {
            let {data} = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            snapshotId = data.snapshot_id
            length = data.tracks.total;
            tracks = data.tracks
            console.log("data", data.tracks)

        } catch (e) {
            console.log(e)
        }

        //construct a delete request
        
        if (!tracks) break

        const body = {
            "tracks": tracks.items?.slice(0, 100).map(track => {
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
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    let upcomingShows
    try {
        upcomingShows = await prisma.show.findMany({
           where: {
               date: {
                   gte: new Date(),
                   lte: oneWeekFromNow,
               }
           },
           include: {
               bandShows: {
                   include: {
                       band: true
                   }
               }
           }
       });
    } catch (e) {
        console.log("failed to get upcoming shows", e)
    }

    const bands = upcomingShows.flatMap(show => show.bandShows.map(bs => bs.band));
    const allTracks = [];

    for (let band of bands) {
        if (band) {
            let tracks 
            try{
                tracks = await prisma.track.findMany({
                where: { bandId: band.id }
            })
            } catch (e) {
                console.log(`failed to get tracks for band ${band.name}`, e)
            }
            allTracks.push(...tracks);
        }
    }

    const playlistId = process.env.PLAYLIST_ID;
    while (allTracks.length > 0) {
        const first25 = allTracks.splice(0, 25);
        const body = {
            "uris": first25.map(track => track.spotify_uri).filter(uri => uri != null)
        };

        console.log("Spotify request body:", body);
        console.log("Spotify playlist ID:", playlistId);
        const response = await retrySpotifyRequest(token, playlistId, body);
        console.log("Spotify response:", response);
    }

    return true;
};

async function retrySpotifyRequest(token, playlistId, body, retries = 5) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    try {
        return await axios.post(url, body, config);
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] ? parseInt(error.response.headers['retry-after']) : 30;
            console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return retrySpotifyRequest(token, playlistId, body, retries - 1);
        } else {
            console.error("Failed to update Spotify playlist:", error);
            throw error;
        }
    }
}

// const addPreviewUrls = async () => {

//     const tracks = await prisma.track.findMany()

//     const token = await getTokenFromRefresh()

//     let promises = tracks.map(async track => {
//         let id = track.spotify_uri.split("track:")[1]
//         try {
//             let {data} = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             })
//             let preview_url = data.preview_url
    
//             await prisma.track.update({
//                 where: {
//                     id: track.id
//                 },
//                 data: {
//                     preview_url: preview_url
//                 }
//             })
//         } catch (e) {
//             console.log(e, e.message)
//         }
//     })

//     await Promise.all(promises)   

// }

// addPreviewUrls()


module.exports = {
    updateTracksDb,
    clearPlaylist,
    updatePlaylist,
    getTokenFromRefresh


}
