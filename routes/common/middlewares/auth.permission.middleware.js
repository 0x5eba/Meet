const jwt = require('jsonwebtoken'),
    secret = require('../config/env.config')['jwt_secret'];
const adminPermission = require('../config/env.config')['permissionLevels']['ADMIN']


exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return (req, res, next) => {
        let user_permission_level = parseInt(req.jwt.permissionLevel);
        if (user_permission_level === required_permission_level) {
            return next();
        } else {
            console.log("403", "minimumPermissionLevelRequired")
            return res.status(403).send({});
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
            console.log("403", "onlySameUserOrAdminCanDoThisAction")
            return res.status(403).send({});
        }
    }
};