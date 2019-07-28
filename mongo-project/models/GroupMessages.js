const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;
const GroupMessages = new mongoose.Schema({
    name_group: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },

    sender: { type: String, default: "" },
    time: { type: Number, default: 0 },
    message: { type: String, default: "" },
})

// GroupMessages.index({
//     message: 'text',
// })

module.exports = mongoose.model('GroupMessages', GroupMessages)