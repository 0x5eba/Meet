const ProfileController = require('./profiles.model');
const crypto = require('crypto');
var escapeRegExp = require('lodash.escaperegexp');

exports.insert = (req, res, next) => {
    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    req.body.password = salt + "$" + hash;
    req.body.permissionLevel = 1;
    req.body.keyForPrivateMessages = crypto.randomBytes(20).toString('base64');
    ProfileController.createUser(req.body)
        .then((result) => {
            req.body = {
                password: req.body.password,
                nickname: req.body.nickname,
                userId: result._id
            }
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error creating user" })
        })
};

exports.uniqueNickname = (req, res, next) => {
    ProfileController.findByNickname(req.body.nickname)
        .then((user) => {
            if (user) {
                res.status(403).send({ err: 'Nickname already taken' });
            } else {
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Wrong nickname" })
        })
}

exports.uniqueNicknameForGoogle = (req, res, next) => {
    ProfileController.findByNickname(req.body.nickname)
        .then((user) => {
            if (user) {
                // devo fare il login
                req.body = {
                    password: req.body.password,
                    nickname: req.body.nickname,
                    userId: user._id
                }
                return next();
            } else {
                // devo fare il register prima del login
                let salt = crypto.randomBytes(16).toString('base64');
                let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
                req.body.password = salt + "$" + hash;
                req.body.permissionLevel = 1;
                ProfileController.createUser(req.body)
                    .then((result) => {
                        req.body = {
                            password: req.body.password,
                            nickname: req.body.nickname,
                            userId: result._id
                        }
                        return next()
                    })
                    .catch(err => {
                        res.status(403).send({ err: "Error creating user" })
                    })
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Wrong nickname" })
        })
}

exports.list = (req, res) => {
    ProfileController.list()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Wrong get list profiles" })
        })
};

exports.getById = (req, res) => {
    ProfileController.findById(req.params.userId)
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Wrong get profile" })
        })
};

exports.patchById = (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }
    ProfileController.patchUser(req.params.userId, req.body)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Wrong profile data" })
        })
};

exports.patchByIdBookmarkGroup = (req, res) => {
    ProfileController.patchUserBookmark(req.params.userId, req.params.groupId, "savedGroup")
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error save group in bookmark" })
        })
};

exports.patchByIdBookmarkQuestion = (req, res) => {
    ProfileController.patchUserBookmark(req.params.userId, req.params.questionId, "savedQuestion")
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error save question in bookmark" })
        })
};

exports.removeById = (req, res) => {
    ProfileController.removeById(req.params.userId)
        .then((result)=>{
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error removing profile" })
        })
};

exports.getSaved = (req, res) => {
    ProfileController.findById(req.params.userId)
        .then((result) => {
            let user = {
                savedGroup: result['savedGroup'],
                savedQuestion: result['savedQuestion']
            }
            res.status(200).send(user);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting bookmarks" })
        })
};

exports.profilePos = (userId, req, res, next) => {
    ProfileController.findByIdGetPos(userId)
        .then((result) => {
            console.log(result)
            if (result['fakePos']['x'] != 0 && result['fakePos']['y'] != 0) {
                req.body.pos = result['fakePos'];
            } else {
                req.body.pos = result['pos'];
            }
            return next()
        })
        .catch(err => {
            res.status(403).send({ err: "Error get position profile" })
        })
}

exports.allProfiles = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    ProfileController.findByPos(search_x, search_y, range_search, res)
};

exports.searchProfiles = (req, res) => {
    search = escapeRegExp(req.body.search)
    ProfileController.searchProfiles(search)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error searching profiles" })
        })
}

exports.getTsProfiles = (req, res) => {
    ProfileController.getTsProfiles()
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting heapmap" })
        })
}

exports.uploadPhoto = (req, res) => {
    var img = { data: req.files.photo.data, contentType: req.files.photo.mimetype }
    ProfileController.uploadPhoto(req.params.userId, img)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error upload photo" })
        })
}