const sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();


const db = new sequelize(process.env.DB_URL_2, {
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 300000,
    },
    pool: {
        acquire: 300000,
        idle: 300000
    },
    logging: false
});

module.exports = db