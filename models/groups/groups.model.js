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
            time: { type: Number, default: 0 },
            message: { type: String, require: true, minlength: 1, default: "" },
        }],
        default: [] 
    }
})

// Group.index({
//     name: 'text',
// })

const Group = mongoose.model('Group', GroupModel)

exports.findByName = (name) => {
    return Group.findOne({ name: name });
};

exports.findById = (id) => {
    return Group.findById(id)
        .then((result) => {
            return result.toJSON();
        });
};

exports.subscribers = (id) => {
    return Group.findById(id, { subscribers: 1, _id: 0 })
        .then((result) => {
            return result.toJSON();
        });
};

exports.peopleOnline = (id) => {
    return Group.findById(id, { peopleOnline: 1 , _id: 0})
};

exports.nOnline = (id) => {
    return Group.aggregate([{ $project: { nOnline: 1, nOnline: { $size: '$peopleOnline' } } }, { $match: { _id: ObjectId(id) } }])
};

exports.createGroup = (data) => {
    const group = new Group(data);
    return group.save();
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Group.find()
            .exec(function (err, users) {
                if (err) {
                    reject(err);
                } else {
                    resolve(users);
                }
            })
    });
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
        Group.remove({ _id: groupId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
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
                    "mag": { $toInt: "2" },
                },
                "geometry": { "type": "Point", "coordinates": ["$pos.x", "$pos.y"] }
            }, 
        }, 
        { "$match": { "circle": { $lte: range_search }, 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } } }
    ])
        .then(groups => {
            data.features = groups
            res.status(200).send(data);
        });
};

exports.messagesSorted = (groupId) => {
    return new Promise((resolve, reject) => {
        Group.findById(groupId, { "messages.sender": 1, "messages.time": 1, "messages.message": 1, _id: 0 })
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

exports.createMessages = (groupId, userId, data, timestamp) => {
    message = {
        sender: userId,
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
    return Group.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }, { name: 1 }).limit(20)
}