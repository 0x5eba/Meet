const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;

const Question = new mongoose.Schema({
    nickname: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    title: { type: String, default: "" },
    details: { type: String, default: "" },
    time: { type: Number, default: 0 },
    imgUrl: { type: String, default: "" },
    urls: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    vote: { type: Number, default: 0 },
    whoVoted: { type: [String], default: [] },
    views: { type: Number, default: 0 },
})

Question.index({
    title: 'text',
    details: 'text',
    hashtags: 'text',
    vote: 1,
    views: 1,
    time: 1,
}, {
    weights: {
        title: 10,
        pos: 10,
        details: 7,
        vote: 3,
        time: 2,
        views: 1,
    },
});

// Question.index({
//     details: 'text',
//     title: 'text',
// })

module.exports = mongoose.model('Question', Question)