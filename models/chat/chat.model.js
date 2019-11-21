const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

// var SchemaTypes = mongoose.Schema.Types;
// var ObjectId = SchemaTypes.ObjectId;

const ChatModel = new mongoose.Schema({
    members: { type: [String], require: true, minlength: 2, default: [] },
    // lastMessageTimestamp: { type: Number, default: 0 },
    // lastMessage: { type: String, default: "" },
    pic: { type: String, default: "" },
    title: { type: String, default: "" },
    messages: { 
        type: [{
            _id: false,
            sender: { type: String, require: true, minlength: 2, default: "" },
            nickname: { type: String, require: true },
            time: { type: Number, default: 0 },
            message: { type: String, require: true, minlength: 1, default: "" },
        }],
        default: [] 
    },
})

const Chat = mongoose.model('Chat', ChatModel)
// var person = new Chat({
//     "members": [
//         "5da0b87fe4bc3f74718c5854",
//         "5d8ccc22a7926ba0df0b66c4"
//     ],
//     messages: [
//         {
//             sender: "5d8ccc22a7926ba0df0b66c4",
//             nickname: "ciao",
//             message: "hola",
//         },
//         {
//             sender: "5da0b87fe4bc3f74718c5854",
//             nickname: "sbiollo@gmail.com",
//             message: "yooo",
//         }
//     ]
// });
// person.save()

exports.getChats = (userId) => {
    return new Promise((resolve, reject) => {
        Chat.find({ members: { $in: [userId] } })
            .sort({ "messages.time": 'desc' }).exec(function (err, messages) {
                if (err) reject(err);
                resolve(messages);
            });
    })
}

exports.createChat = (data) => {
    return new Promise((resolve, reject) => {
        const chat = new Chat(data);
        chat.save(function (err, chat) {
            if (err) return reject(err);
            resolve(chat);
        });
    })
};

exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        Chat.findById(id, function (err, chat) {
            if (err) reject(err);
            resolve(chat);
        });
    })
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Chat.find({}, function (err, chat) {
            if (err) reject(err);
            resolve(chat);
        });
    })
};

exports.patchchatAddToSet = (chatId, userId, type) => {
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(chatId, { $addToSet: { [type]: userId } }, function (err, chat) {
            if (err) reject(err);
            resolve(chat);
        });
    })
};

exports.patchchatPullToSet = (chatId, userId, type) => {
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(chatId, { $pull: { [type]: userId } }, function (err, chat) {
            if (err) reject(err);
            resolve(chat);
        });
    })
};

exports.removeById = (chatId) => {
    return new Promise((resolve, reject) => {
        Chat.remove({ _id: chatId}, (err, chat) => {
            if (err) reject(err);
            resolve(chat);
        });
    });
};

exports.messagesSorted = (chatId) => {
    return new Promise((resolve, reject) => {
        Chat.findById(chatId, { "messages": 1 })
            .sort({ "messages.time": 'desc' }).exec(function (err, messages) {
                if (err) reject(err);
                resolve(messages);
            });
    });
};

exports.getLastMessageTimestamp = (chatId, lastTime) => {
    return new Promise((resolve, reject) => {
        Chat.findById(chatId, { "lastMessageTimestamp": 1, _id: 0 }, function (err, lastMessageTimestamp){
            if (err) reject(err);
            resolve(lastMessageTimestamp);
        })
    });
};

exports.createMessages = (chatId, userId, nickname, data, timestamp) => {
    message = {
        sender: userId,
        nickname: nickname,
        time: timestamp,
        message: data,
    }
    
    return new Promise((resolve, reject) => {
        Chat.findByIdAndUpdate(chatId, { $push: { messages: message }, lastMessageTimestamp: timestamp }, function (err, message) {
            if (err) reject(err);
            resolve(message);
        })
    });
};