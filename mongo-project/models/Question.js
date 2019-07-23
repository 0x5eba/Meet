const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

const Question = new mongoose.Schema({
    nickname: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    time: { type: Date, default: Date.now },
    question: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
})

module.exports = mongoose.model('Question', Question)