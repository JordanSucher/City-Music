const db = require ('./db');
const Sequelize = require('sequelize');

const Show = db.define('show', {
    omr_id : {
        type: Sequelize.INTEGER,
        unique: true
    },
    ticket_url: {
        type: Sequelize.TEXT
    },
    venue_name: {
        type: Sequelize.STRING
    },
    date: {
        type: Sequelize.DATE
    }
})

module.exports = Show