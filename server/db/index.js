const db = require('./db');
const Show = require('./Shows.js');
const Band = require('./Bands');
const Track = require('./Tracks');

Band.belongsToMany(Show, { through: 'band_shows', constraints: false });
Show.belongsToMany(Band, { through: 'band_shows', constraints: false });

Track.belongsTo(Band, {constraints: false});
Band.hasMany(Track, { as: 'tracks', foreignKey: 'bandId', constraints: false });

module.exports = {
    db,
    Show,
    Band,
    Track
}