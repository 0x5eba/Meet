const jwt = require('jsonwebtoken')
const config = require('../../common/config/env.config.js')
var randtoken = require('rand-token')

const jwtSecret = config.jwtSecret
const jwtSecret2 = config.jwtSecret2
const jwtExpireAccessToken = config.jwtExpireAccessToken
const jwtExpireRefreshToken = config.jwtExpireRefreshToken

exports.verifyRefresh = (req, res) => {
    if (newAccessToken(req)){
        return res.status(201).send(req.accessToken)
    } else {
        return res.status(400).send({ err: 'Invalid refresh token'});
    }
};

exports.validJWTNeeded = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send({});
            } else {
                jwt.verify(authorization[1], jwtSecret, function (err, decoded) {
                    if (err) if (!newAccessToken(req)) return res.status(400).send({ err: 'Invalid refresh token' });
                    req.jwt = decoded
                    return next();
                })
            }

        } catch (err) {
            console.log("validJWTNeeded", err)
            return res.status(403).send({err: "Invalid token"});
        }

    } else {
        if(newAccessToken(req)) {
            return res.status(201).send(req.accessToken)
        } else {
            return res.status(400).send({ err: 'Invalid refresh token' });
        }
    }
};

function newAccessToken(req) {
    var cookieRefreshToken = null;
    let rc = req.headers.cookie;
    rc && rc.split(';').forEach(function (cookie) {
        let parts = cookie.split('=');
        if (parts[0].trim() === "refreshToken") {
            cookieRefreshToken = decodeURI(parts[1].trim())
        }
    });

    if (cookieRefreshToken) {
        // qui devi controllare se refresh token e' valido, se lo e' crea un nuovo accesstoken e mettilo in req, poi fai next()
        try {
            jwt.verify(cookieRefreshToken, jwtSecret2, function (err, decoded) {
                if (err) return false
                req.jwt = decoded
                req.jwt = {
                    userId: req.jwt.userId,
                    nickname: req.jwt.nickname,
                    salt: randtoken.uid(128),
                    permissionLevel: req.jwt.permissionLevel,
                }
                let accessToken = jwt.sign(req.jwt, jwtSecret, { expiresIn: jwtExpireAccessToken });

                req.accessToken = {"accessToken": accessToken }
            })
        } catch (err) {
            console.log("newAccessToken", err)
            return false
        }

        return true
    } else {
        // tokene expired, quindi mandagli un messaggio che deve ri loggare
        return false
    }
}