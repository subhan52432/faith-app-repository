const express = require('express');
const { createPool } = require('mysql');
const formData = require('express-form-data')
const morgan = require('morgan')
const app = express()
const con = require('./config')
const nodemailer = require('nodemailer')
require('dotenv').config();

var cors = require('cors')
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors())

app.use(formData.parse());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}



app.use(express.json())
app.use(express.urlencoded({ extended: false }));

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
                    res.status(200).json({
                        message: "Email Already Exist",
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                    })
                } else {
                    console.log("successfully Run")
                    res.status(200).json({
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
                        res.status(200).json({
                            message: "message already exists",
                            rowAffected: result.affectedRows,
                            submit: 1
                        })

                    } else {
                        res.status(200).json({
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

//get All users APi with pagination url: /api/getUsers?numPerPage=10&page=0
app.get("/api/getUsers", async (req, res) => {

    var numRows;
    var queryPagination
    const numPerPage = parseInt(req.query.numPerPage)
    var page = parseInt(req.query.page)
    var numPages
    var skip = page * numPerPage
    var limit = skip + ',' + numPerPage
    await con.getConnection(function (err, conn) {
        if (err) {
            res.send([
                {
                    error: "Error Occured in server connection"
                }
            ])
        }
        else {
            conn.query(`SELECT count(*) as numRows from user`, (error, resultss, fields) => {
                numRows = resultss[0].numRows
                numPages = Math.ceil(numRows / numPerPage)
                console.log(numPages)
                //conn.release()
                conn.query('SELECT id, name, email, phone, submit FROM user LIMIT ' + limit, (error, results, fields) => {
                    var responsePayload = {
                        result: results
                    }
                    if (page < numPages) {
                        responsePayload.pagination = {
                            error: 'none',
                            current: page,
                            dataCount: numRows,
                            pages: numPages,
                            perPage: numPerPage,
                            previous: page > 0 ? page - 1 : undefined,
                            next: page < numPages - 1 ? page + 1 : undefined
                        }
                    }
                    else {
                        responsePayload.pagination = {
                            error: 'queried page ' + page + ' is >= to maximum page number ' + numPages
                        }
                    }
                    res.json(responsePayload)
                    conn.release()
                })

            })


        }
    })
})

// get msg by user email url: /api/getMessage?email=sman@gmail.com
app.get("/api/getMessage", async (req, res) => {
    var email = req.query.email
    await con.getConnection(function (err, conn) {
        if (err) {
            res.send([
                {
                    error: "Error Occured in server connection",
                    result: []
                }
            ])
        }
        else {
            conn.query(`SELECT name2, howCanWePrayForYou, wouldYouMindIfWeContactedYou from user WHERE email = '${email}'`, (error, results, fields) => {
                console.log(results)
                var responsePayload
                if (error) {
                    responsePayload = {
                        error: 'Error Occured in Query',
                        result: []
                    }

                }
                else {
                    responsePayload = {
                        error: 'none',
                        result: results
                    }
                }

                res.json(responsePayload)
                conn.release()
            })
        }
    })
})

// login portal User by email and password url: /api/loginportaluser
app.post("/api/loginportaluser", async (req, res) => {
    var data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send([
                {
                    error: "Error Occured in server connection",
                    result: []
                }
            ])
        }
        else {
            conn.query(`SELECT id, Name, email, phone from portaluser WHERE email = '${data.email}' AND password = '${data.password}'`, (error, results, fields) => {
                var responsePayload
                if (error) {
                    responsePayload = {
                        error: 'Error Occured in Query',
                        result: []
                    }

                }
                else if (results.length === 0) {
                    responsePayload = {
                        error: 'Unauthorized User',
                        result: results
                    }
                }
                else {
                    responsePayload = {
                        error: 'none',
                        result: results
                    }
                }
                res.json(responsePayload)
                conn.release()
            })
        }
    })
})

// update portaluser name and phone by email, name, phone  url: /api/updatedetailsportaluser
app.post("/api/updatedetailsportaluser", async (req, res) => {
    var data = req.body
    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        }
        else {
            conn.query(`UPDATE portaluser SET name = '${data.name}', phone = '${data.phone}' WHERE email = '${data.email}'`, (error, results, fields) => {
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })
                }
                else if (results.affectedRows === 0) {
                    res.send({
                        error: 'true',
                        msg: "User Not Exist",
                        result: {}
                    })
                }
                else {
                    res.send({
                        error: 'false',
                        msg: "Updated Successfully",
                        result: results
                    })
                }
                conn.release()
            })
        }
    })
})

// update portaluser password by email, oldPassword and newPassword  url: /api/updatepasswordportaluser
app.post("/api/updatepasswordportaluser", async (req, res) => {
    var data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        }
        else {
            conn.query(`SELECT password from portaluser WHERE email = '${data.email}' AND password = '${data.oldPassword}'`, (error, results, fields) => {
                var responsePayload
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })

                }
                else if (results.length === 0) {
                    res.send({
                        error: 'true',
                        msg: "Incorrect Old Password",
                        result: results
                    })
                }
                else {
                    conn.query(`UPDATE portaluser SET password = '${data.newPassword}' WHERE email = '${data.email}'`, (errors, resultss, fields) => {
                        if (errors) {
                            res.send({
                                error: 'true',
                                msg: "Error Occured in Query",
                                result: []
                            })
                        }
                        else {

                            res.send({
                                error: 'false',
                                msg: "Password Updated Successfully",
                                result: resultss
                            })
                        }

                    })
                }
                conn.release()
            })
        }
    })
})

// sending-email by email in body ==>> url: /api/sendEmailOtp
app.post("/api/sendEmailOtp", async (req, res) => {
    var data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        }
        else {
            conn.query(`SELECT email from portaluser WHERE email = '${data.email}'`, (error, results, fields) => {
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })
                }
                else if (results.length === 0) {
                    res.send({
                        error: 'true',
                        msg: "email does not exist",
                        result: results
                    })
                }
                else {
                    const otpcode = Math.floor((Math.random() * 1000000) + 1)
                    conn.query(`INSERT INTO otp SET ?`, { email: data.email, code: otpcode, expiresIn: new Date().getTime() + 300 * 1000 }, (error, resultss, fields) => {
                        if (error) {
                            res.send({
                                error: 'true',
                                msg: "Error Occured in otp Insert Query",
                                result: []
                            })
                        }
                        else {
                            mailer(data.email, otpcode)
                            res.send({
                                error: 'none',
                                msg: "please check your Email Id",
                                result: resultss
                            })
                        }
                    })

                }
                conn.release()
            })
        }
    })
})

// Validate Otp by email, code in body ==>> url: /api/validateOtp
app.post("/api/validateOtp", async (req, res) => {
    var data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        }
        else {
            conn.query(`SELECT * from otp WHERE email = '${data.email}' AND code = '${data.code}'`, (error, results, fields) => {
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })
                }
                else if (results.length === 0) {
                    res.send({
                        error: 'true',
                        msg: "Token Invalid",
                        result: results
                    })
                }
                else if (results) {
                    res.send({
                        error: 'none',
                        msg: "Token Validated",
                        result: results
                    })

                }
                conn.release()
            })
        }
    })
})

// change password by email, password in body ==>> url: /api/changePassword
app.post("/api/changePassword", async (req, res) => {
    var data = req.body

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        } else {
            conn.query(`UPDATE portaluser SET password = '${data.password}' WHERE email = '${data.email}'`, (error, results, fields) => {
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })
                }
                else if (results.affectedRows === 0) {
                    res.send({
                        error: 'true',
                        msg: "something went wrong",
                        result: results
                    })
                }
                else {
                    res.send({
                        error: 'none',
                        msg: "password Updated Successfully",
                        result: results
                    })
                }
                conn.release()
            })
        }
    })
})

// get portaluser name, phone by email in body ==>> url: /api/getPortalUserDetails?email=subhan@gmail.com
app.get("/api/getPortalUserDetails", async (req, res) => {
    var email = req.query.email

    await con.getConnection(function (err, conn) {
        if (err) {
            res.send(
                {
                    error: "true",
                    msg: "Error Occured in server connection",
                    result: []
                }
            )
        }
        else{
            conn.query(`SELECT Name, phone from portaluser WHERE email = '${email}'`, (error, results, fields) => {
                if (error) {
                    res.send({
                        error: 'true',
                        msg: "Error Occured in Query",
                        result: []
                    })
                }
                else if(results.length === 0){
                    res.send({
                        error: 'true',
                        msg: "User not found",
                        result: results
                    })
                }
                else{
                    res.send({
                        error: 'none',
                        msg: "User Found Successfully",
                        result: results
                    })
                }
                conn.release()
            })
        }
    })
})

//mailer function
const mailer = (email, otpcode) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'zibbleweb@gmail.com',
            pass: 'nrllmavnsjiyziik'
        }
    })

    var mailOptions = {
        from: 'zibbleweb@gmail.com',
        to: 'zibbleweb@gmail.com',
        subject: 'Sending email using node js',
        text: `Your Forget password otp is: ${otpcode}`
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
)

