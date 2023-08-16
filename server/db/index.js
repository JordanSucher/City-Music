const db = require('./db');
const Show = require('./Shows.js');
const Band = require('./Bands');
const Track = require('./Tracks');

Band.belongsToMany(Show, { through: 'band_shows' });
Show.belongsToMany(Band, { through: 'band_shows' });

Track.belongsTo(Band);
Band.hasMany(Track, { as: 'tracks' });

module.exports = {
    db,
    Show,
    Band,
    Track
}