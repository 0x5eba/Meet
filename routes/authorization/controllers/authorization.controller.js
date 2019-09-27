const jwtSecret = require('../../common/config/env.config.js').jwt_secret,
    jwt = require('jsonwebtoken');
const crypto = require('crypto');
// const uuid = require('node-uuid');

exports.login = (req, res) => {
    try {
        let refreshId = req.body.userId + jwtSecret;
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(refreshId).digest("base64");
        req.body.refreshKey = salt;
        req.body.permissionLevel = 1;
        let token = jwt.sign(req.body, jwtSecret);
        let refresh_token = Buffer.from(hash).toString('base64')
        res.status(201).send({ accessToken: token, refreshToken: refresh_token, id: req.body.userId});
    } catch (err) {
        res.status(500).send({errors: err});
    }
};

exports.refresh_token = (req, res) => {
    try {
        req.body = req.jwt;
        let token = jwt.sign(req.body, jwtSecret);
        res.status(201).send({id: token});
    } catch (err) {
        res.status(500).send({errors: err});
    }
};