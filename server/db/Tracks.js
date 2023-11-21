const db = require ('./db');
const Sequelize = require('sequelize');

const Track = db.define('track',{
    name: {
        type: Sequelize.STRING
    },
    spotify_uri: {
        type: Sequelize.STRING,
        unique: true
    },
    bandId: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
})

module.exports = Track