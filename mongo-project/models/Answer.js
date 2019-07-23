const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

const Answer = new mongoose.Schema({
    question: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },

    answer: { type: String, default: "" },
})

module.exports = mongoose.model('Answer', Answer)