const db = require ('./db');
const Sequelize = require('sequelize');

const Band = db.define('band',{
    name: {
        type: Sequelize.STRING,
        unique: true
    },
    spotify_id: {
        type: Sequelize.STRING,
    }
})

module.exports = Band