const mongoose = require('mongoose')

const GroupMessages = new mongoose.Schema({
    name_group: { type: String, default: "" },
    pos: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },

    sender: { type: String, default: "" },
    time: { type: Date, default: Date.now },
    message: { type: String, default: "" },
})

module.exports = mongoose.model('GroupMessages', GroupMessages)