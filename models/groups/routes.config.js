const GroupController = require('./groups.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permissionLevels.ADMIN;
const FREE = config.permissionLevels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.post('/api/group/create/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        GroupController.uniqueName,
        GroupController.getProfilePos,
        GroupController.insert
    ]);
    app.get('/api/groups', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        GroupController.list
    ]);
    // app.get('/api/group/:groupId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     PermissionMiddleware.minimumPermissionLevelRequired(FREE),
    //     // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
    //     GroupController.getById
    // ]);
    
    app.patch('/api/group/:groupId&:userId', [
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
    app.get('/api/group/name/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getName
    ]);
    app.get('/api/group/peopleOnline/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getByIdPeopleOnline
    ]);
    app.get('/api/group/nOnline/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getByIdnOnline
    ]);
    app.get('/api/group/isSub/:groupId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        GroupController.getIsSub
    ]);
    app.post('/api/group/showSubs/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getAllSubs,
        GroupController.getShowSubs
    ]);
    app.post('/api/group/search', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.searchGroups,
    ]);
    app.post('/api/group/heapmap', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getTsGroups,
    ]);

    /*************************
    *     GROUP MESSAGES     *
    **************************/

    app.post('/api/group/chat/messages/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.getMessagesWithLimit,
    ]);
    app.post('/api/group/chat/checkLastMessage/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        GroupController.checkLastMessage,
    ]);
    app.patch('/api/group/chat/write/:groupId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        GroupController.getProfileNickname,
        GroupController.writeMessage,
    ]);
};
