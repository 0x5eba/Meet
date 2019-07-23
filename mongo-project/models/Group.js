const mongoose = require('mongoose')

const Group = new mongoose.Schema({
    name: { type: String, default: "" },
    pos: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
})

module.exports = mongoose.model('Group', Group)