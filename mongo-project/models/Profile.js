const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;

const Profile = new mongoose.Schema({
    nickname: { type: String, trim: true, default: '' },

    password: { type: String, default: ''},
    name: { type: String, trim: true, default: '' },
    surname: { type: String, trim: true, default: '' },
    bio: { type: String, default: '' },
    // pic: { data: Buffer, contentType: String },
    real_position: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    fake_position: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    online: { type: Boolean, default: false },
    lastSeen: { type: Number, default: 0 },
    use_fake_position: { type: Boolean, default: false },

    savedGroup: { type: [{ _id: false, name: String, pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } } }], default: [] },
    savedQuestion: { type: [{ _id: false, question: String, pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } } }], default: [] },
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