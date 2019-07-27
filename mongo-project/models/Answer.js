const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

const Answer = new mongoose.Schema({
    title: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },

    time: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    vote: { type: Number, default: 0 },
    data: { type: String, default: "" },
    parent: { type: String, default: "" },
})

module.exports = mongoose.model('Answer', Answer)