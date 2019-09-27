const jwt = require('jsonwebtoken'),
    secret = require('../config/env.config.js').jwt_secret,
    crypto = require('crypto');

exports.verifyRefreshBodyField = (req, res, next) => {
    if (req.body && req.body.refresh_token) {
        return next();
    } else {
        return res.status(400).send({error: 'need to pass refresh_token field'});
    }
};

exports.validRefreshNeeded = (req, res, next) => {
    let refresh_token = Buffer.from(req.body.refresh_token, 'base64').toString();
    let hash = crypto.createHmac('sha512', req.jwt.refreshKey).update(req.jwt.userId + secret).digest("base64");
    if (hash === refresh_token) {
        req.body = req.jwt;
        return next();
    } else {
        return res.status(400).send({error: 'Invalid refresh token'});
    }
};

exports.validJWTNeeded = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send();
            } else {
                jwt.verify(authorization[1], secret, function (err, decoded) {
                    if (err) return res.status(400).send({ error: 'Invalid token' });
                    req.jwt = decoded
                    return next();
                })
            }

        } catch (err) {
            console.log("validJWTNeeded", err)
            return res.status(403).send({err: err});
        }
    } else {
        return res.status(401).send();
    }
};