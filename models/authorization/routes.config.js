const VerifyUserMiddleware = require('./middlewares/verify.user.middleware');
const AuthorizationController = require('./controllers/authorization.controller');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
exports.routesConfig = function (app) {

    app.post('/api/auth', [
        AuthValidationMiddleware.verifyCaptcha,
        VerifyUserMiddleware.hasAuthValidFields,
        VerifyUserMiddleware.isPasswordAndUserMatch,
        AuthorizationController.login
    ]);

    app.post('/api/auth/refresh', [
        AuthValidationMiddleware.verifyRefresh
    ]);
};

/*
access token va messo in localstorage
refresh token in httponly

access token expire 15 minuti
refresh token expire 4 giorni

access token sign con jwtSecret e come payload ci metti l'userId e nickname
refresh token sign con jwtSecret2 e come payload ci metti l'userId e nickname
*/