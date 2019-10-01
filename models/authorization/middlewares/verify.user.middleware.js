const UserModel = require('../../profiles/profiles.model');
const crypto = require('crypto');

exports.hasAuthValidFields = (req, res, next) => {
    let errors = [];

    if (req.body) {
        if (!req.body.nickname) {
            errors.push('Missing nickname field');
        }
        if (!req.body.password) {
            errors.push('Missing password field');
        }

        if (errors.length) {
            return res.status(400).send({err: errors.join(',')});
        } else {
            return next();
        }
    } else {
        return res.status(400).send({ err: 'Missing nickname and password fields'});
    }
};

exports.isPasswordAndUserMatch = (req, res, next) => {
    UserModel.userInfoForAuthenitcate(req.body.nickname)
        .then((user)=>{
            if (!user){
                res.status(404).send({err: 'User not found'});
            } else {
                let passwordFields = user.password.split('$');
                let salt = passwordFields[0];
                let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
                if (hash === passwordFields[1]) {
                    req.body = {
                        userId: user._id,
                        nickname: user.nickname,
                    };
                    return next();
                } else {
                    return res.status(400).send({err: 'Invalid e-mail or password'});
                }
            }
        });
};