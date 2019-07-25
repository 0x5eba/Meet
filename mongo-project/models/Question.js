const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

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
    vote: { type: Number, default: 0 }
})

module.exports = mongoose.model('Question', Question)