require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const prisma = require('./prisma/prismaClient.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get venues with upcoming shows
app.get('/api/venues', async (req, res) => {
  try {
    const selectedDate = req.query.date;
    let dateFilter = { gte: new Date() };

    if (selectedDate) {
      // Parse the date string directly as UTC to match database storage
      const startOfDay = new Date(selectedDate + 'T00:00:00.000Z');
      const endOfDay = new Date(selectedDate + 'T23:59:59.999Z');

      console.log(`Selected date: ${selectedDate}`);
      console.log(`UTC range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      dateFilter = { gte: startOfDay, lte: endOfDay };
    } else {
      // Default to today and onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(`Default filter - today onwards: ${today}`);
      dateFilter = { gte: today };
    }

    console.log('Fetching venues with shows for date filter:', dateFilter);

    // Get shows with band data, filtered by date
    const upcomingShows = await prisma.show.findMany({
      where: {
        date: dateFilter
      },
      include: {
        bandShows: {
          include: {
            band: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: 5 // Limit bands per show
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 30 // Back to original working limit
    });

    console.log(`Found ${upcomingShows.length} upcoming shows`);

    // Debug: Log first few show dates to understand timezone storage
    upcomingShows.slice(0, 3).forEach(show => {
      console.log(`Show date in DB: ${show.date} (UTC: ${show.date.toISOString()})`);
    });

    // Filter out shows without venue info and group by venue
    const venueMap = new Map();

    upcomingShows.forEach(show => {
      if (show.venue_name && show.latlong && !venueMap.has(show.venue_name)) {
        const bands = show.bandShows.map(bs => bs.band).filter(band => band);

        venueMap.set(show.venue_name, {
          venue_name: show.venue_name,
          latlong: show.latlong,
          venue_id: show.id,
          shows: [{
            id: show.id,
            date: show.date,
            ticket_url: show.ticket_url,
            bands: bands
          }]
        });
      }
    });

    const venues = Array.from(venueMap.values());
    console.log(`Grouped into ${venues.length} unique venues`);

    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// API endpoint to get YouTube audio stream
app.get('/api/youtube-audio/:query', async (req, res) => {
  try {
    const { query } = req.params;
    console.log(`YouTube audio request for: "${query}"`);

    const ytSearch = require('youtube-search-api');
    const ytdl = require('ytdl-core');

    // Search for the video
    const searchResults = await ytSearch.GetListByKeyword(query, false, 1);

    if (searchResults && searchResults.items && searchResults.items.length > 0) {
      const firstResult = searchResults.items[0];
      const videoUrl = `https://www.youtube.com/watch?v=${firstResult.id}`;

      console.log(`Found YouTube video: ${firstResult.title}`);

      try {
        // Get audio stream info
        const info = await ytdl.getInfo(videoUrl);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        if (audioFormats.length > 0) {
          const bestAudio = audioFormats[0];

          res.json({
            success: true,
            title: firstResult.title,
            audio_url: bestAudio.url,
            duration: firstResult.length?.simpleText || 'Unknown',
            thumbnail: firstResult.thumbnail?.thumbnails?.[0]?.url
          });
        } else {
          throw new Error('No audio formats found');
        }
      } catch (ytdlError) {
        console.error('YouTube audio extraction error:', ytdlError.message);
        res.json({
          success: false,
          message: `Found "${firstResult.title}" but couldn't extract audio`,
          fallback_url: videoUrl
        });
      }
    } else {
      res.json({
        success: false,
        message: `No YouTube results for: ${query}`,
        fallback_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
      });
    }
  } catch (error) {
    console.error('Error fetching YouTube audio:', error);
    res.json({
      success: false,
      message: 'YouTube search failed',
      fallback_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(req.params.query)}`
    });
  }
});

// API endpoint to get Spotify artist ID
app.get('/api/spotify-artist/:bandName', async (req, res) => {
  try {
    const { bandName } = req.params;
    console.log(`Getting Spotify artist ID for: "${bandName}"`);

    // Check if we have the artist ID stored in database first
    const band = await prisma.band.findFirst({
      where: {
        name: bandName
      }
    });

    if (band && band.spotify_id) {
      console.log(`Found stored Spotify ID for ${bandName}: ${band.spotify_id}`);
      return res.json({
        success: true,
        artist_id: band.spotify_id,
        artist_name: band.name
      });
    }

    // If not in database, search Spotify API
    try {
      const { getTokenFromRefresh } = require('./spotify.js');
      const spotifyToken = await getTokenFromRefresh();

      if (spotifyToken) {
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(bandName)}&type=artist&limit=1`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();

          if (searchData.artists.items.length > 0) {
            const artistId = searchData.artists.items[0].id;
            console.log(`Found Spotify artist ID for ${bandName}: ${artistId}`);

            return res.json({
              success: true,
              artist_id: artistId,
              artist_name: searchData.artists.items[0].name
            });
          }
        }
      }
    } catch (spotifyError) {
      console.error('Spotify API error:', spotifyError.message);
    }

    res.json({
      success: false,
      message: `No Spotify artist found for ${bandName}`
    });
  } catch (error) {
    console.error('Error getting Spotify artist:', error);
    res.status(500).json({ error: 'Failed to get Spotify artist' });
  }
});

// API endpoint to get band's music preview
app.get('/api/music/:bandName', async (req, res) => {
  try {
    const { bandName } = req.params;
    console.log(`Searching for music for band: "${bandName}"`);

    // Find band in database (try exact match first, then partial)
    let band = await prisma.band.findFirst({
      where: {
        name: bandName
      },
      include: {
        tracks: true
      }
    });

    // If no exact match, try case-sensitive contains
    if (!band) {
      band = await prisma.band.findFirst({
        where: {
          name: {
            contains: bandName
          }
        },
        include: {
          tracks: true
        }
      });
    }

    console.log(`Found band:`, band ? band.name : 'Not found');
    console.log(`Band has ${band?.tracks?.length || 0} tracks`);

    if (!band) {
      console.log(`No band found for "${bandName}"`);
      return res.json({
        band: bandName,
        preview_url: null,
        message: `No band found for "${bandName}"`
      });
    }

    if (band.tracks.length === 0) {
      console.log(`Band "${band.name}" has no tracks`);
      return res.json({
        band: bandName,
        preview_url: null,
        message: `No tracks found for ${band.name}`
      });
    }

    // Log track details for debugging
    console.log('Track details:', band.tracks.map(t => ({
      name: t.name,
      has_preview: !!t.preview_url,
      preview_url: t.preview_url?.substring(0, 50) + '...' || 'null'
    })));

    // Get a random track with preview_url
    const tracksWithPreview = band.tracks.filter(track => track.preview_url && track.preview_url.trim() !== '');
    console.log(`Tracks with preview: ${tracksWithPreview.length}/${band.tracks.length}`);

    if (tracksWithPreview.length === 0) {
      console.log(`No preview URLs available for "${band.name}", trying Spotify API...`);

      try {
        // Get Spotify token from your existing system
        const { getTokenFromRefresh } = require('./spotify.js');
        const spotifyToken = await getTokenFromRefresh();

        if (spotifyToken) {
          // Search for the band on Spotify
          const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(band.name)}&type=artist&limit=1`, {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`
            }
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();

            if (searchData.artists.items.length > 0) {
              const artistId = searchData.artists.items[0].id;
              console.log(`Found Spotify artist: ${searchData.artists.items[0].name} (${artistId})`);

              // Get top tracks for this artist
              const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                headers: {
                  'Authorization': `Bearer ${spotifyToken}`
                }
              });

              if (tracksResponse.ok) {
                const tracksData = await tracksResponse.json();
                const tracksWithPreviews = tracksData.tracks.filter(track => track.preview_url);

                if (tracksWithPreviews.length > 0) {
                  const randomTrack = tracksWithPreviews[Math.floor(Math.random() * tracksWithPreviews.length)];
                  console.log(`Found Spotify preview: ${randomTrack.name}`);

                  return res.json({
                    band: bandName,
                    track_name: randomTrack.name,
                    preview_url: randomTrack.preview_url,
                    spotify_uri: randomTrack.uri,
                    image_url: randomTrack.album.images[0]?.url,
                    from_spotify_api: true
                  });
                } else {
                  console.log('No preview URLs found in Spotify top tracks');
                }
              }
            } else {
              console.log(`No Spotify artist found for "${band.name}"`);
            }
          }
        }
      } catch (spotifyError) {
        console.error('Spotify API error:', spotifyError.message);
      }

      // Fallback if Spotify API fails
      const randomTrack = band.tracks?.[Math.floor(Math.random() * band.tracks.length)];
      return res.json({
        band: bandName,
        track_name: randomTrack?.name || 'Unknown',
        preview_url: null,
        message: `No preview found for ${band.name}`
      });
    }

    const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
    console.log(`Selected track: "${randomTrack.name}" with preview: ${!!randomTrack.preview_url}`);

    res.json({
      band: bandName,
      track_name: randomTrack.name,
      preview_url: randomTrack.preview_url,
      spotify_uri: randomTrack.spotify_uri,
      image_url: randomTrack.image_url
    });
  } catch (error) {
    console.error('Error fetching music:', error);
    res.status(500).json({ error: 'Failed to fetch music' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🗺️  Map site server running on port ${PORT}`);
  console.log(`📍 View map at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});