const ProfileController = require('./profiles.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const AuthControllerMiddleware = require('../authorization/controllers/authorization.controller.js');
const config = require('../common/config/env.config');

const ADMIN = config.permissionLevels.ADMIN;
const FREE = config.permissionLevels.NORMAL_USER;

const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/photo',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (err, buf) => {
                if (err) {
                    return reject({ err: "Error upload photo" });
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

exports.routesConfig = function (app) {
    app.post('/api/profile/create', [
        ValidationMiddleware.limitRequest,
        ValidationMiddleware.verifyCaptcha,
        ProfileController.uniqueNickname,
        ProfileController.insert,
        AuthControllerMiddleware.login
    ]);
    app.post('/api/profile/create/google', [
        ValidationMiddleware.limitRequest,
        ValidationMiddleware.verifyCaptcha,
        ValidationMiddleware.verifyGoogleToken,
        ProfileController.uniqueNicknameForGoogle,
        AuthControllerMiddleware.login
    ]);
    app.get('/api/profiles', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        ProfileController.list
    ]);
    app.get('/api/profile/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.getById
    ]);
    app.patch('/api/profile/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ProfileController.patchById
    ]);
    app.delete('/api/profile/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        ProfileController.removeById
    ]);

    app.post('/api/profile/getSaved/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ProfileController.getSaved
    ]);
    app.patch('/api/profile/bookmarkGroup/:userId&:groupId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ProfileController.patchByIdBookmarkGroup
    ]);
    app.patch('/api/profile/bookmarkQuestion/:userId&:questionId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        ProfileController.patchByIdBookmarkQuestion
    ]);
    app.post('/api/profile/near', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.allProfiles
    ]);
    app.post('/api/profile/search', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.searchProfiles,
    ]);
    app.post('/api/profile/heapmap', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.getTsProfiles,
    ]);
    app.post('/api/profile/uploadPic/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        upload.single('file'),
        ProfileController.uploadPic
    ]);
    app.get('/api/profile/getPic/:filename', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        ProfileController.getPic
    ]);
};
