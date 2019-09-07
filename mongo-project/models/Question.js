const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;

const Question = new mongoose.Schema({
    title: { type: String, require: true, minlength: 4, default: "" },
    
    nickname: { type: String, require: true, minlength: 2, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },
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
}, {
    weights: {
        title: 9,
        details: 6,
        hashtags: 3,
    },
});

// Question.index({
//     details: 'text',
//     title: 'text',
// })

module.exports = mongoose.model('Question', Question)