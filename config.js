const mysql = require('mysql')
require('dotenv').config();


const con = mysql.createPool({
    connectionLimit:100,
    host:process.env.HOST,
    user:process.env.USER,
    password:process.env.PASSWORD,
    database: process.env.DATABASE
})




module.exports = con;