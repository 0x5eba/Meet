const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    nickname: String,
    password: String,
    permissionLevel: Number
});

const User = mongoose.model('Users', userSchema);

exports.findByNickname = (nickname) => {
    return User.findOne({ nickname: nickname});
};

exports.findById = (id) => {
    return User.findById(id, { password: 0, permissionLevel: 0 })
        .then((result) => {
            return result.toJSON();
        });
};

exports.createUser = (userData) => {
    const user = new User(userData);
    return user.save();
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        User.find({}, { password: 0, permissionLevel: 0 })
            .exec(function (err, users) {
                if (err) {
                    reject(err);
                } else {
                    resolve(users);
                }
            })
    });
};

exports.patchUser = (id, userData) => {
    return new Promise((resolve, reject) => {
        User.findById(id, function (err, user) {
            if (err) reject(err);
            for (let i in userData) {
                if (['firstName', 'lastName', 'password'].includes(i)){
                    user[i] = userData[i];
                }
            }
            user.save(function (err, updatedUser) {
                if (err) return reject(err);
                resolve(updatedUser);
            });
        });
    })

};

exports.removeById = (userId) => {
    return new Promise((resolve, reject) => {
        User.remove({_id: userId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

