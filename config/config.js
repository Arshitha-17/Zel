const myEnv = require('dotenv').config()

const sessionSecret=process.env.SESSIONSECRET
const emailUser=process.env.EMAILUSER
const emailPassword= process.env.EMAILPASSWORD

const razorpayKey=process.env.RAZORPAY_ID_KEY
const razorpaySecret=process.env.RAZORPAY_SECRET_KEY


module.exports = { 
    sessionSecret,
    emailUser,
    emailPassword,
    razorpayKey,
    razorpaySecret
}