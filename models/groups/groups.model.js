const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

ObjectId = require('mongodb').ObjectID;

var SchemaTypes = mongoose.Schema.Types;
const GroupModel = new mongoose.Schema({
    name: { type: String, require: true, minlength: 4, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },
    peopleOnline: { type: [String], default: [] },
    subscribers: { type: [String], default: [] },

    lastMessageTimestamp: { type: Number, default: 0 },
    messages: { 
        type: [{
            // _id: false,
            sender: { type: String, require: true, minlength: 2, default: "" },
            nickname: { type: String, require: true },
            time: { type: Number, default: 0 },
            message: { type: String, require: true, minlength: 1, default: "" },
        }],
        default: [] 
    }
})

const Group = mongoose.model('Group', GroupModel)

exports.findByName = (name) => {
    return new Promise((resolve, reject) => {
        Group.findOne({ name: name }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        Group.findById(id, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.getNameById = (id) => {
    return new Promise((resolve, reject) => {
        Group.findById(id, { name: 1 }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.subscribers = (id) => {
    return new Promise((resolve, reject) => {
        Group.findById(id, { subscribers: 1, _id: 0 }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.peopleOnline = (id) => {
    return new Promise((resolve, reject) => {
        Group.findById(id, { peopleOnline: 1 , _id: 0}, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.nOnline = (id) => {
    return new Promise((resolve, reject) => {
        Group.aggregate([{ $project: { nOnline: 1, nOnline: { $size: '$peopleOnline' } } }, { $match: { _id: ObjectId(id) } }], function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.createGroup = (data) => {
    return new Promise((resolve, reject) => {
        const group = new Group(data);
        group.save(function (err, group) {
            if (err) return reject(err);
            resolve(group);
        });
    })
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Group.find({}, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.patchGroupAddToSet = (groupId, userId, type) => {
    return new Promise((resolve, reject) => {
        Group.findByIdAndUpdate(groupId, { $addToSet: { [type]: userId } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.patchGroupPullToSet = (groupId, userId, type) => {
    return new Promise((resolve, reject) => {
        Group.findByIdAndUpdate(groupId, { $pull: { [type]: userId } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    })
};

exports.removeById = (groupId) => {
    return new Promise((resolve, reject) => {
        Group.remove({ _id: groupId}, (err, group) => {
            if (err) reject(err);
            resolve(group);
        });
    });
};

exports.isSub = (groupId, userId) => {
    return new Promise((resolve, reject) => {
        Group.findOne({ _id: groupId, subscribers: { $in: [userId] } }, function (err, group) {
            if (err) reject(err);
            resolve(group);
        });
    });
};


exports.findByPos = (search_x, search_y, range_search, res) => {
    let data = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": []
    }

    Group.aggregate([
        { $project: {
                circle: { $sum: [ 
                        { $multiply: [{ $subtract: ["$pos.x", search_x] }, { $subtract: ["$pos.x", search_x] }] }, 
                        { $multiply: [{ $subtract: ["$pos.y", search_y] }, { $subtract: ["$pos.y", search_y] }] }
                    ]},
                "type": "Feature",
                "properties": {
                    'name': "$name",
                    'id': "$_id",
                    "mag": 2,
                },
                "geometry": { "type": "Point", "coordinates": ["$pos.x", "$pos.y"] }
            }, 
        }, 
        { "$match": { "circle": { $lte: range_search }, 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } } }
    ])
        .then(groups => {
            data.features = groups
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting groups near you" })
        })
};

exports.messagesSorted = (groupId) => {
    return new Promise((resolve, reject) => {
        Group.findById(groupId, { "messages": 1 })
            .sort({ "messages.time": 'desc' }).exec(function (err, messages) {
                if (err) reject(err);
                resolve(messages);
            });
    });
};

exports.getLastMessageTimestamp = (groupId, lastTime) => {
    return new Promise((resolve, reject) => {
        Group.findById(groupId, { "lastMessageTimestamp": 1, _id: 0 }, function (err, lastMessageTimestamp){
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
        Group.findByIdAndUpdate(groupId, { $push: { messages: message }, lastMessageTimestamp: timestamp }, function (err, message) {
            if (err) reject(err);
            resolve(message);
        })
    });
};

exports.searchGroups = (search) => {
    return new Promise((resolve, reject) => {
        Group.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }, { name: 1 }).limit(20).exec(function (err, groups) {
            if (err) reject(err);
            resolve(groups);
        });
    })
}