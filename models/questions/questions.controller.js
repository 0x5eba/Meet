const QuestionController = require('./questions.model');
const getProfilePosFromProfile = require('../profiles/profiles.model')['profilePos']
const showSubsOnMapFromProfile = require('../profiles/profiles.model')['subsOnMap']
const crypto = require('crypto');
var escapeRegExp = require('lodash.escaperegexp');

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
            res.status(403).send({ err: "Error creating question" })
        })
};

exports.uniqueTitle = (req, res, next) => {
    QuestionController.findByTitle(req.body.title)
        .then((question) => {
            if (question) {
                res.status(403).send({ err: 'Title already token' });
            } else {
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error title question" })
        })
}

exports.list = (req, res) => {
    QuestionController.list()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting list questions" })
        })
};

exports.getById = (req, res) => {
    QuestionController.findById(req.params.questionId)
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error get question" })
        })
};

// exports.checkIsCreator = (req, res, next) => {
//     QuestionController.isCreator(req.params.questionId)
//         .then((result) => {
//             console.log("checkIsCreator", result)
//             if (req.params.userId === result['idCreator']) {
//                 return next();
//             } else {
//                 console.log("403", "checkIsCreator")
//                 return res.status(403).send({ err: "Wrong question credential" });
//             }
//         });
// };

exports.patchByIdByCreator = (req, res) => {
    QuestionController.patchQuestionByCreator(req.params.questionId, req.body.deatils, req.body.html)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error modifing question" })
        })
}

exports.patchByIdVoteQuestion = (req, res) => {
    vote = req.body.vote
    if(vote === 1 || vote === -1){
        QuestionController.updateVoteQuestion(req.params.questionId, req.params.userId, vote)
            .then((result) => {
                res.status(201).send(result)
            })
            .catch(err => {
                return res.status(403).send({ err: "Error wrong vote" })
            })
    } else {
        res.status(403).send({ err: "Error wrong vote" })
    }
};

exports.checkIfVotedQuestion = (req, res, next) => {
    QuestionController.hasVotedQuestion(req.params.questionId, req.params.userId)
        .then((result) => {
            if(result === null){
                return next()
            } else {
                return res.status(403).send({ err: 'You already voted' })
            }
        })
        .catch(err => {
            res.status(403).send({ err: 'Error voting question' })
        })
};

exports.removeById = (req, res) => {
    QuestionController.removeById(req.params.questionId)
        .then((result)=>{
            res.status(204).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: 'Error removing question' })
        })
};

exports.getProfilePos = (req, res, next) => {
    getProfilePosFromProfile(req.params.userId)
        .then((pos) => {
            if (!pos) {
                res.status(403).send({ err: 'User not found' });
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
            res.status(403).send({ err: "Error get profile position" })
        })
};

exports.allQuestions = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    QuestionController.findByPos(search_x, search_y, range_search, res)
};

exports.createAnswer = (req, res) => {
    QuestionController.createAnswer(req.params.questionId, req.params.userId, req.body, Date.now())
        .then((result) => {
            res.status(201).send({ id: result['_id'] });
        })
        .catch(err => {
            res.status(403).send({ err: "Error creating answer" })
        })
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
            return res.status(403).send({ err: "Error voting answer" })
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
                return res.status(403).send({ err: "Error vote answer" })
            })
    } else {
        res.status(403).send({ err: "Wrong vote" })
    }
};

exports.searchQuestions = (req, res) => {
    search = escapeRegExp(req.body.search)
    QuestionController.searchQuestions(search)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error searching questions" })
        })
}