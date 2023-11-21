const db = require ('./db');
const Sequelize = require('sequelize');

const BandShow = Sequelize.define('band_show',{
    bandId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    showId: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
})