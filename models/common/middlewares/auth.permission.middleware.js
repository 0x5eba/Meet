const jwt = require('jsonwebtoken'),
    secret = require('../config/env.config')['jwt_secret'];
const adminPermission = require('../config/env.config')['permissionLevels']['ADMIN']


exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return (req, res, next) => {
        let user_permission_level = parseInt(req.jwt.permissionLevel);
        if (user_permission_level === adminPermission || user_permission_level === required_permission_level) {
            return next();
        } else {
            return res.status(403).send({ err: "Wrong permissions" });
        }
    };
};

exports.onlySameUserOrAdminCanDoThisAction = (req, res, next) => {
    let user_permission_level = parseInt(req.jwt.permissionLevel);
    let userId = req.jwt.userId;
    if (req.params && req.params.userId && userId === req.params.userId) {
        return next();
    } else {
        if (user_permission_level === adminPermission) {
            return next();
        } else {
            return res.status(403).send({ err: "You are not the owner" });
        }
    }
};