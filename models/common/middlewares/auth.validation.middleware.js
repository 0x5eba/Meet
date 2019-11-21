const jwt = require('jsonwebtoken')
const config = require('../../common/config/env.config.js')
var randtoken = require('rand-token')
const https = require('https');

const jwtSecret = config.jwtSecret
const jwtSecret2 = config.jwtSecret2
const jwtExpireAccessToken = config.jwtExpireAccessToken
const jwtExpireRefreshToken = config.jwtExpireRefreshToken

const { OAuth2Client } = require('google-auth-library');
CLIENT_ID = "184507738418-664h9ifot6obetrd887dp5hgi5opopr2.apps.googleusercontent.com"
const client = new OAuth2Client(CLIENT_ID);


exports.verifyRefresh = (req, res) => {
    return newAccessToken(req, res);
};

exports.validJWTNeeded = (req, res, next) => {
    if (req.headers['authorization']) {
        try {
            let authorization = req.headers['authorization'].split(' ');
            if (authorization[0] !== 'Bearer') {
                return res.status(401).send({ err: 'Invalid access token' });
            } else {
                jwt.verify(authorization[1], jwtSecret, function (err, decoded) {
                    if (err) return res.status(400).send({ err: 'Invalid refresh token' });
                    req.jwt = decoded
                    var current_time = new Date().getTime() / 1000;
                    if (current_time > decoded.exp) {
                        newAccessToken(req, res);
                    } else {
                        return next();
                    }
                })
            }
        } catch (err) {
            return res.status(403).send({err: "Invalid access token"});
        }
    } else {
        return newAccessToken(req, res);
    }
};

function newAccessToken(req, res) {
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
                if (err) return res.status(400).send({ err: 'Invalid refresh token' });
                var current_time = new Date().getTime() / 1000;
                if (current_time > decoded.exp) {
                    /* expired */ 
                    try {
                        req.body = {
                            userId: decoded.userId,
                            nickname: decoded.nickname,
                            salt: randtoken.uid(128),
                            permissionLevel: decoded.permissionLevel,
                        }
                        let accessToken = jwt.sign(req.body, jwtSecret, { expiresIn: jwtExpireAccessToken });

                        let refreshToken = jwt.sign(req.body, jwtSecret2, { expiresIn: jwtExpireRefreshToken });

                        return res.status(201).cookie('refreshToken', refreshToken, {
                            httpOnly: true,
                            //FORSERVER secure: true,
                            SameSite: "None", // Lax
                            // expires: new Date(Date.now() + (jwtExpireRefreshToken*1000)) // cookie will be removed
                        }).send({ accessToken: accessToken });

                    } catch (err) {
                        return res.status(400).send({ err: 'Invalid refresh token' });
                    }
                } else {
                    req.jwt = decoded
                    req.jwt = {
                        userId: req.jwt.userId,
                        nickname: req.jwt.nickname,
                        salt: randtoken.uid(128),
                        permissionLevel: req.jwt.permissionLevel,
                    }
                    let accessToken = jwt.sign(req.jwt, jwtSecret, { expiresIn: jwtExpireAccessToken });

                    req.accessToken = { "accessToken": accessToken }

                    return res.status(201).send(req.accessToken)
                }
            })
        } catch (err) {
            return res.status(400).send({ err: 'Invalid refresh token' });
        }
    } else {
        // tokene expired, quindi mandagli un messaggio che deve ri loggare
        return res.status(400).send({ err: 'Invalid refresh token' });
    }
}

var ipCreateAccount = {}
exports.limitRequest = (req, res, next) => {
    let remoteip = req.connection.remoteAddress
    let currDate = new Date()
    if(ipCreateAccount[remoteip] !== undefined){
        if(currDate - ipCreateAccount[remoteip] > 21600*1000) { // 6 ore
            ipCreateAccount[remoteip] = currDate
            return next()
        } else {
            return res.status(500).send({ err: 'Wait to creating another account' });
        }
    } else {
        ipCreateAccount[remoteip] = currDate
        return next()
    }
}

exports.verifyCaptcha = (req, res, next) => {
    console.log("OK2")
    if (req.body.recaptcha === undefined || req.body.recaptcha === '' || req.body.recaptcha === null) {
        console.log("WTF")
        return res.status(500).send({ err: 'Please select captcha first' });
    }
    const secretKey = '6Ld5r7sUAAAAACT8sYktCkwGEC-9piie7xEhNaXO';
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.recaptcha}&remoteip=${req.connection.remoteAddress}`;

    https.get(verificationURL, (resG) => {
        var rawData = '';
        resG.on('data', (chunk) => { rawData += chunk })
        resG.on('end', function () {
            try {
                var parsedData = JSON.parse(rawData);
                if (parsedData.success === true && parsedData.score >= 0.6) {
                    delete req.body['recaptcha']
                    return next()
                } else {
                    return res.status(500).send({ err: 'Failed captcha verification' });
                }
            } catch (e) {
                console.log(e)
                return res.status(500).send({ err: 'Failed captcha verification from Google' });
            }
        });
    });
}

exports.verifyGoogleToken = (req, res, next) => {
    if (req.body.id_token === undefined || req.body.id_token === '' || req.body.id_token === null) {
        return res.status(500).send({ err: 'Please select id token first' });
    }
    try {
        verifyAuth2(req.body.id_token, res, req, next)
    } catch (e) {
        return res.status(500).send({ err: 'Invalid Google Token' });
    }
}
async function verifyAuth2(token, res, req, next) {
    let ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    let payload = ticket.getPayload();
    req.body = {
        nickname: payload['email'],
        password: payload['sub'],
        name: payload['name'],
    }
    if (payload['aud'] !== CLIENT_ID){
        return res.status(500).send({ err: 'Invalid Google Token' });
    }
    return next()
}