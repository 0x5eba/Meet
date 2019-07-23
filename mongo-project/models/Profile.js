const mongoose = require('mongoose')

const Profile = new mongoose.Schema({
    nickname: { type: String, trim: true, default: '' },
    // pic: { data: Buffer, contentType: String },
    real_position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    fake_position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
    online: { type: Boolean, default: false },
    use_fake_position: { type: Boolean, default: false }
})

module.exports = mongoose.model('Profile', Profile)