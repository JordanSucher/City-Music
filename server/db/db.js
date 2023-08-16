const sequelize = require('sequelize');

const db = new sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_URL,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false
})


module.exports = db