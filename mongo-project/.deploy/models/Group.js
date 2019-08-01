const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;
const Group = new mongoose.Schema({
    name: { type: String, require: true, minlength: 4, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 }},
    peopleOnline: { type: [{ _id: false, nickname: String, id: String }], default: [] }
})

Group.index({
    name: 'text',
})

module.exports = mongoose.model('Group', Group)