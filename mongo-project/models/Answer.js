const mongoose = require('mongoose')

const Answer = new mongoose.Schema({
    question: { type: String, default: "" },
    pos: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },

    answer: { type: String, default: "" },
})

module.exports = mongoose.model('Answer', Answer)