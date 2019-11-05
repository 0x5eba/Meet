const QuestionController = require('./questions.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permissionLevels.ADMIN;
const FREE = config.permissionLevels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.post('/api/question/create/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        QuestionController.uniqueTitle,
        QuestionController.getProfilePos,
        QuestionController.getProfileNickname,
        QuestionController.insert
    ]);
    app.get('/api/questions', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        QuestionController.list
    ]);
    app.get('/api/question/:questionId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        QuestionController.getById
    ]);
    // app.patch('/api/question/byCreator/:questionId&:userId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     PermissionMiddleware.minimumPermissionLevelRequired(FREE),
    //     PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
    //     QuestionController.checkIsCreator,
    //     QuestionController.patchByIdByCreator
    // ]);
    app.patch('/api/question/:questionId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        QuestionController.checkIfVotedQuestion,
        QuestionController.patchByIdVoteQuestion
    ]);
    app.delete('/api/question/:questionId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        QuestionController.removeById
    ]);

    app.post('/api/question/near', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        QuestionController.allQuestions
    ]);
    app.post('/api/question/search', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        QuestionController.searchQuestions,
    ]);
    app.post('/api/question/heapmap', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        QuestionController.getTsQuestions,
    ]);
   

    /*************************
    *        ANSWERS         *
    **************************/

    app.patch('/api/question/answer/create/:questionId&:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        QuestionController.getProfileNickname,
        QuestionController.createAnswer
    ]);
    app.patch('/api/question/answer/:questionId&:userId&:answerId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        QuestionController.checkIfVotedAnswer,
        QuestionController.patchByIdVoteAnswer
    ]);
};
