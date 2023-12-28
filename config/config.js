// config.js

const sessionSecret = process.env.SESSION_SECRET;
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

module.exports ={
    sessionSecret,
    emailUser,
    emailPassword
}