const GroupController = require('./groups.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permissionLevels.ADMIN;
const FREE = config.permissionLevels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.post('/api/groups/create', [
        GroupController.uniqueName,
        GroupController.insert
    ]);
    app.get('/api/groups', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        GroupController.list
    ]);
    app.get('/api/group/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        GroupController.getById
    ]);
    app.patch('/api/group/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        GroupController.patchById
    ]);
    app.delete('/api/group/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        GroupController.removeById
    ]);

    app.post('/api/group/allGroups', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.allGroups
    ]);
};
