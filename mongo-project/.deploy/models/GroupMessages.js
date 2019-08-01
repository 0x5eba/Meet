const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;
const GroupMessages = new mongoose.Schema({
    name_group: { type: String, require: true, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },

    sender: { type: String, require: true, minlength: 2, default: "" },
    time: { type: Number, default: 0 },
    message: { type: String, require: true, minlength: 1, default: "" },
})

// GroupMessages.index({
//     message: 'text',
// })

module.exports = mongoose.model('GroupMessages', GroupMessages)