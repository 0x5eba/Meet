const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;

const Profile = new mongoose.Schema({
    nickname: { type: String, trim: true, require: true, minlength: 4, default: '' },

    password: { type: String, require: true, minlength: 4, default: ''},
    name: { type: String, trim: true, default: '' },
    surname: { type: String, trim: true, default: '' },
    bio: { type: String, default: '' },
    // pic: { data: Buffer, contentType: String },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    fakePos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    online: { type: Boolean, default: false },
    lastSeen: { type: Number, default: 0 },
    savedGroup: { type: [String], default: [] },
    savedQuestion: { type: [String], default: [] },
})

Profile.index({
    nickname: 'text',
    name: 'text',
    surname: 'text',
}, {
    weights: {
        nickname: 10,
        name: 6,
        surname: 6,
    },
})

module.exports = mongoose.model('Profile', Profile)