const mongoose = require('mongoose')

const Question = new mongoose.Schema({
    nickname: { type: String, default: "" },
    pos: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    time: { type: Date, default: Date.now },
    question: { type: String, default: "" },
    anonymous: { type: Boolean, default: false },
})

module.exports = mongoose.model('Question', Question)