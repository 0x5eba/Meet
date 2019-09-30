const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

ObjectId = require('mongodb').ObjectID;

var SchemaTypes = mongoose.Schema.Types;
const QuestionModel = new mongoose.Schema({
    title: { type: String, require: true, minlength: 4 },
    idCreator: { type: String, require: true },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },
    details: { type: String, default: "" },
    html: { type: String, default: "" },
    time: { type: Number, default: 0 },
    vote: { type: Number, default: 0 },
    whoVoted: { type: [String], default: [] },
    // views: { type: Number, default: 0 },

    answers: {
        type: [{
            idProfile: { type: String, require: true, default: "" },
            time: { type: Number, default: 0 },
            level: { type: Number, default: 0 },
            data: { type: String, require: true, minlength: 1, default: "" },
            parent: { type: String, default: "" },
            vote: { type: Number, default: 0 },
            whoVoted: { type: [String], default: [] },
        }],
        default: [],
    }
})

const Question = mongoose.model('Question', QuestionModel)

exports.findByTitle = (title) => {
    return new Promise((resolve, reject) => {
        Question.findOne({ title: title }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    })
};

exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        Question.findById(id).sort({ "answers.level": 'asc', "answers.vote": 'desc', "answers.time": 'asc' }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    })
};

exports.createQuestion = (data) => {
    return new Promise((resolve, reject) => {
        const quest = new Question(data);
        return quest.save(function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    })
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Question.find({}, function (err, question) {
            if (err) reject(err);
            resolve(question);
        })
    });
};

exports.removeById = (questionId) => {
    return new Promise((resolve, reject) => {
        Question.remove({ _id: questionId}, (err, question) => {
            if (err) reject(err);
            resolve(question);
        });
    });
};

exports.isCreator = (questionId) => {
    return new Promise((resolve, reject) => {
        Question.findById(questionId, { idCreator: 1 }, (err, question) => {
            if (err) reject(err);
            resolve(question);
        });
    });
};

exports.patchQuestionByCreator = (id, details, html) => {
    return new Promise((resolve, reject) => {
        Question.findByIdAndUpdate(id, { details: details, html: html }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        })
    });
}

exports.updateVoteQuestion = (id, userId, vote) => {
    return new Promise((resolve, reject) => {
        Question.findByIdAndUpdate(id, { $addToSet: { whoVoted : userId }, $inc: { vote: vote } }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    })
}

exports.updateVoteAnswer = (idQuestion, idAnswer, userId, vote) => {
    return new Promise((resolve, reject) => {
        Question.findOneAndUpdate({ _id: idQuestion, "answers._id": idAnswer }, 
                { $addToSet: { "answers.$.whoVoted": userId }, $inc: { "answers.$.vote": vote } }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    })
}

exports.hasVotedQuestion = (questionId, userId) => {
    return new Promise((resolve, reject) => {
        Question.findOne({ _id: questionId, whoVoted: { $in: [userId] } }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    });
};

exports.hasVotedAnswer = (questionId, idAnswer, userId) => {
    return new Promise((resolve, reject) => {
        Question.findOne({ _id: questionId }, { "answers": { $elemMatch: { whoVoted: { $in: [userId] }, _id: idAnswer } } }, function (err, question) {
            if (err) reject(err);
            resolve(question);
        });
    });
};

exports.findByPos = (search_x, search_y, range_search, res) => {
    let data = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": []
    }

    var timestampNow = Date.now()

    Question.aggregate([
        { $project: {
                circle: { $sum: [ 
                        { $multiply: [{ $subtract: ["$pos.x", search_x] }, { $subtract: ["$pos.x", search_x] }] }, 
                        { $multiply: [{ $subtract: ["$pos.y", search_y] }, { $subtract: ["$pos.y", search_y] }] }
                    ]},
                // 3600000 = 1000 * 60 * 60 
                // if (Math.floor((timestampNow - questions[i]['time']) / 3600000) > 24) continue
                diffTime: { $floor: { $divide: [ { $subtract: [timestampNow, "$time"] }, 3600000 ] } },
                "type": "Feature",
                "properties": {
                    'title': "$title",
                    'details': "$details",
                    'id': "$_id",
                    "mag": { $toInt: "2" },
                },
                "geometry": { "type": "Point", "coordinates": ["$pos.x", "$pos.y"] }
            }, 
        }, 
        { "$match": { "circle": { $lte: range_search }, "diffTime": { $lt: 24 }, 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } } }
    ])
        .then(questions => {
            data.features = questions
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting questions near you" })
        })
};

exports.createAnswer = (questionId, userId, body, timestamp) => {
    message = {
        idProfile: userId,
        time: timestamp,
        level: body.level,
        data: body.data, 
        parent: body.parent, 
    }

    return new Promise((resolve, reject) => {
        Question.findByIdAndUpdate(questionId, { $push: { answers: message } }, function (err, message) {
            if (err) reject(err);
            resolve(message);
        })
    });
};

exports.searchQuestions = (search) => {
    return Question.find({
        "$or": [
            { title: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
            { details: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
            { details: { "$regex": new RegExp("^[#]" + search.toLowerCase(), "i") } }
        ]
    }, { title: 1, details: 1 }).limit(20).exec(function (err, qustions) {
        if (err) reject(err);
        resolve(qustions);
    });
}