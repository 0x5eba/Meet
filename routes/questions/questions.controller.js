const QuestionController = require('./questions.model');
const getProfilePosFromProfile = require('../profiles/profiles.model')['profilePos']
const showSubsOnMapFromProfile = require('../profiles/profiles.model')['subsOnMap']
const crypto = require('crypto');

exports.insert = (req, res) => {
    req.body = {
        title: req.body.title,
        pos: req.body.pos,
        time: Date.now(),
        idCreator: req.params.userId,
        details: req.body.details,
        html: req.body.html,
    }
    QuestionController.createQuestion(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        })
        .catch(err => {
            res.status(403).send({ err: err })
        })
};

exports.createAnswer = (req, res) => {
    QuestionController.createAnswer(req.params.questionId, req.params.userId, req.body, Date.now())
        .then((result) => {
            res.status(201).send({ id: result['_id'] });
        })
        .catch(err => {
            res.status(403).send({ err: err })
        })
};

exports.uniqueTitle = (req, res, next) => {
    QuestionController.findByTitle(req.body.title)
        .then((question) => {
            if (question) {
                res.status(403).send({ errors: ['Title already token'] });
            } else {
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({})
        })
}

exports.list = (req, res) => {
    QuestionController.list()
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    QuestionController.findById(req.params.questionId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.checkIsCreator = (req, res, next) => {
    QuestionController.isCreator(req.params.questionId)
        .then((result) => {
            console.log("checkIsCreator", result)
            if (req.params.userId === result['idCreator']) {
                return next();
            } else {
                console.log("403", "checkIsCreator")
                return res.status(403).send({});
            }
        });
};

exports.patchByIdByCreator = (req, res) => {
    QuestionController.patchQuestionByCreator(req.params.questionId, req.body.deatils, req.body.html)
        .then((result) => {
            res.status(201).send({ res: result });
        })
        .catch(err => {
            res.status(403).send({ err: err })
        })
}

exports.patchByIdVoteQuestion = (req, res) => {
    vote = req.body.vote
    if(vote === 1 || vote === -1){
        QuestionController.updateVoteQuestion(req.params.questionId, req.params.userId, vote)
            .then((result) => {
                res.status(201).send({})
            })
            .catch(err => {
                return res.status(403).send({ err: err })
            })
    } else {
        res.status(403).send({ err: "Wrong vote" })
    }
};

exports.checkIfVotedQuestion = (req, res, next) => {
    QuestionController.hasVotedQuestion(req.params.questionId, req.params.userId)
        .then((result) => {
            if(result === null){
                return next()
            } else {
                return res.status(403).send({ err: 'Already voted' })
            }
        })
        .catch(err => {
            return res.status(403).send({ err: err })
        })
};

exports.removeById = (req, res) => {
    QuestionController.removeById(req.params.questionId)
        .then((result)=>{
            res.status(204).send({});
        });
};

exports.getProfilePos = (req, res, next) => {
    getProfilePosFromProfile(req.params.userId)
        .then((pos) => {
            if (!pos) {
                res.status(403).send({ errors: ['User not found'] });
            } else {
                if (pos['fakePos']['x'] != 0 && pos['fakePos']['y'] != 0){
                    req.body.pos = pos['fakePos'];
                } else {
                    req.body.pos = pos['pos'];
                }
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({err: err})
        })
};

exports.allQuestions = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    QuestionController.findByPos(search_x, search_y, range_search, res)
};

exports.checkIfVotedAnswer = (req, res, next) => {
    QuestionController.hasVotedAnswer(req.params.questionId, req.params.answerId, req.params.userId)
        .then((result) => {
            if (result === null || result['answers'].length === 0) {
                return next()
            } else {
                return res.status(403).send({ err: 'Already voted' })
            }
        })
        .catch(err => {
            return res.status(403).send({ err: err })
        })
};

exports.patchByIdVoteAnswer = (req, res) => {
    vote = req.body.vote
    if (vote === 1 || vote === -1) {
        QuestionController.updateVoteAnswer(req.params.questionId, req.params.answerId, req.params.userId, vote)
            .then((result) => {
                res.status(201).send({})
            })
            .catch(err => {
                console.log(err)
                return res.status(403).send({ err: err })
            })
    } else {
        res.status(403).send({ err: "Wrong vote" })
    }
};