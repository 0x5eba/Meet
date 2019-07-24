const mongoose = require('mongoose')
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;
const Group = new mongoose.Schema({
    name: { type: String, default: "" },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    peopleOnline: { type: [{ _id: false, nickname: String, id: String }], default: [] }
})

module.exports = mongoose.model('Group', Group)