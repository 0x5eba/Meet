const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;

const Answer = new mongoose.Schema({
    title: { type: String, require: true, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },

    time: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    data: { type: String, require: true, minlength: 1, default: "" },
    parent: { type: String, default: "" },
    vote: { type: Number, default: 0 },
    whoVoted: { type: [String], default: [] },
})

// Answer.index({
//     data: 'text',
// })

module.exports = mongoose.model('Answer', Answer)