const ChatController = require('./chat.controller');
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
        ChatController.uniqueName,
        ChatController.getProfilePos,
        ChatController.insert
    ]);
    app.get('/api/groups', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        ChatController.list
    ]);
    // app.get('/api/group/:groupId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     PermissionMiddleware.minimumPermissionLevelRequired(FREE),
    //     // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
    //     ChatController.getById
    // ]);
    
    app.patch('/api/group/:groupId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ChatController.patchById
    ]);
    app.delete('/api/group/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        ChatController.removeById
    ]);

    app.post('/api/group/near', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.allGroups
    ]);
    app.get('/api/group/name/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getName
    ]);
    app.get('/api/group/peopleOnline/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getByIdPeopleOnline
    ]);
    app.get('/api/group/nOnline/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getByIdnOnline
    ]);
    app.get('/api/group/isSub/:groupId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ChatController.getIsSub
    ]);
    app.post('/api/group/showSubs/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getAllSubs,
        ChatController.getShowSubs
    ]);
    app.post('/api/group/search', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.searchGroups,
    ]);
    app.post('/api/group/heapmap', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getTsGroups,
    ]);

    /*************************
    *     GROUP MESSAGES     *
    **************************/

    app.post('/api/group/chat/messages/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.getMessagesWithLimit,
    ]);
    app.post('/api/group/chat/checkLastMessage/:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ChatController.checkLastMessage,
    ]);
    app.patch('/api/group/chat/write/:groupId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ChatController.getProfileNickname,
        ChatController.writeMessage,
    ]);
};
