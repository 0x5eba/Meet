const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

// var SchemaTypes = mongoose.Schema.Types;
// var ObjectId = SchemaTypes.ObjectId;

const ChatModel = new mongoose.Schema({
    members: { type: [String], require: true, minlength: 2, default: [] },
    lastMessageTimestamp: { type: Number, default: 0 },
    messages: { 
        type: [{
            _id: false,
            sender: { type: String, require: true, minlength: 2, default: "" },
            nickname: { type: String, require: true },
            time: { type: Number, default: 0 },
            message: { type: String, require: true, minlength: 1, default: "" },
        }],
        default: [] 
    }
})

const Chat = mongoose.model('Chat', ChatModel)

exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        Chat.findById(id, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.getNameById = (id) => {
    return new Promise((resolve, reject) => {
        Chat.findById(id, { name: 1 }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.subscribers = (id) => {
    return new Promise((resolve, reject) => {
        Chat.findById(id, { subscribers: 1, _id: 0 }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.peopleOnline = (id) => {
    return new Promise((resolve, reject) => {
        Chat.findById(id, { peopleOnline: 1 , _id: 0}, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.nOnline = (id) => {
    return new Promise((resolve, reject) => {
        Chat.aggregate([{ $project: { nOnline: 1, nOnline: { $size: '$members' } } }, { $match: { _id: ObjectId(id) } }], function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.createGroup = (data) => {
    return new Promise((resolve, reject) => {
        const group = new Chat(data);
        group.save(function (err, group) {
            if (err) return reject(err);
            resolve(group);
        });
    })
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Chat.find({}, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.patchGroupAddToSet = (groupId, userId, type) => {
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(groupId, { $addToSet: { [type]: userId } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.patchGroupPullToSet = (groupId, userId, type) => {
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(groupId, { $pull: { [type]: userId } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.removeById = (groupId) => {
    return new Promise((resolve, reject) => {
        Chat.remove({ _id: groupId}, (err, group) => {
            if (err) reject(err);
            resolve(group);
        });
    });
};

exports.isSub = (groupId, userId) => {
    return new Promise((resolve, reject) => {
        Chat.findOne({ _id: groupId, subscribers: { $in: [userId] } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    });
};

exports.messagesSorted = (groupId) => {
    return new Promise((resolve, reject) => {
        Chat.findById(groupId, { "messages": 1 })
            .sort({ "messages.time": 'desc' }).exec(function (err, messages) {
                if (err) reject(err);
                resolve(messages);
            });
    });
};

exports.getLastMessageTimestamp = (groupId, lastTime) => {
    return new Promise((resolve, reject) => {
        Chat.findById(groupId, { "lastMessageTimestamp": 1, _id: 0 }, function (err, lastMessageTimestamp){
            if (err) reject(err);
            resolve(lastMessageTimestamp);
        })
    });
};

exports.createMessages = (groupId, userId, nickname, data, timestamp) => {
    message = {
        sender: userId,
        nickname: nickname,
        time: timestamp,
        message: data,
    }
    
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(groupId, { $push: { messages: message }, lastMessageTimestamp: timestamp }, function (err, message) {
            if (err) reject(err);
            resolve(message);
        })
    });
};

exports.searchGroups = (search) => {
    return new Promise((resolve, reject) => {
        Chat.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }, { name: 1 }).limit(20).exec(function (err, groups) {
            if (err) reject(err);
            resolve(groups);
        });
    })
}