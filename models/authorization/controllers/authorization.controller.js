const config = require('../../common/config/env.config.js')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
var randtoken = require('rand-token')
// const uuid = require('node-uuid');

var Recaptcha = require('express-recaptcha').RecaptchaV3;
var recaptcha = new Recaptcha('6Ld5r7sUAAAAAFJMOQE7k3uZsAqH-3DMD3FdNSe6', '6Ld5r7sUAAAAACT8sYktCkwGEC-9piie7xEhNaXO', {callback:'cb'});

const jwtSecret = config.jwtSecret
const jwtSecret2 = config.jwtSecret2
const jwtExpireAccessToken = config.jwtExpireAccessToken
const jwtExpireRefreshToken = config.jwtExpireRefreshToken
const ADMIN = config.permissionLevels.ADMIN;
const FREE = config.permissionLevels.NORMAL_USER;

exports.login = (req, res) => {
    try {
        req.body.salt = randtoken.uid(128);
        req.body.permissionLevel = FREE;
        if(req.body.nickname === "ciao"){
            req.body.permissionLevel = ADMIN;
        }
        let accessToken = jwt.sign(req.body, jwtSecret, { expiresIn: jwtExpireAccessToken });
        
        let refreshToken = jwt.sign(req.body, jwtSecret2, { expiresIn: jwtExpireRefreshToken });

        res.status(201).cookie('refreshToken', refreshToken, {
            httpOnly: true,
            expires: new Date(Date.now() + (jwtExpireRefreshToken*1000)) // cookie will be removed
        }).send({ id: req.body.userId, accessToken: accessToken });

    } catch (err) {
        res.status(500).send({err: "Login falied"});
    }
};

exports.verifyCaptcha = (req, res, next) => {
    token = req.body.token
    recaptcha.verify(token, function(error, data){
        console.log(error, data)
        // if (!req.recaptcha.error) {
        // // success code
        // } else {
        // // error code
        // }

        next()
    });
}