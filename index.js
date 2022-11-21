const express = require('express');
const { createPool } = require('mysql');
const formData = require('express-form-data')
const morgan = require('morgan')
const app = express()
const con = require('./config')
require('dotenv').config();

var cors = require('cors')
app.use(cors({origin: true, credentials: true}));
app.options('*',cors())

app.use(formData.parse());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  


app.use(express.json())
app.use(express.urlencoded({extended: false}));

app.get("/", async (req, res) => {
    res.status(404).json({
        msg: "Api path not found."
      });
})
app.get("/api/users", async (req, res) => {

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send("Error Occured")
        }
        else {
            conn.query("select * from user", (err, result, fields) => {
                if (err) {

                    res.send('Error in query', err)
                } else {
                    console.log("successfully Run")
                    res.send(result)
                }
                conn.release()
            })
        }

    })


})


app.post("/api/user", async (req, res) => {

    const data = req.body
    await con.getConnection(function (err, conn) {
        if (err) {
            res.send("Error Occured")
        }
        else {
            conn.query('Insert INTO user SET ?', data, (error, result, fields) => {
                if (error) {
                    console.log("successfully Run, User Exist")
                    res.status(409).json({
                        message: "Email Already Exist",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                    })
                } else {
                    console.log("successfully Run")
                    res.status(201).json({
                        message: "User Created Successfully",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                    })
                }
                conn.release()
            })
        }
    })




})

app.post("/api/message", async (req, res) => {

    const data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send("Error Occured")
        }
        else {
            conn.query(`UPDATE user SET submit = 1, name2 = '${data.name2}', howCanWePrayForYou = '${data.howCanWePrayForYou}', wouldYouMindIfWeContactedYou = '${data.wouldYouMindIfWeContactedYou}'  WHERE email = '${data.email}' AND submit = 0`, (error, result, fields) => {
                if (error) {
                    res.send(error)
                } else {
                    if (result.affectedRows === 0) {
                        res.status(201).json({
                            message: "message already exists",
                            rowAffected: result.affectedRows,
                            submit: 1
                        })

                    } else {
                        res.status(201).json({
                            message: "message received successfully",
                            rowAffected: result.affectedRows,
                            submit: 1
                        })
                    }

                }
                conn.release()
            })
        }
    })




})

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
)

