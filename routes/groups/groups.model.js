const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);

var SchemaTypes = mongoose.Schema.Types;
const GroupModel = new mongoose.Schema({
    name: { type: String, require: true, minlength: 4, default: "" },
    pos: { x: { type: SchemaTypes.Double, require: true, default: 0 }, y: { type: SchemaTypes.Double, require: true, default: 0 } },
    peopleOnline: { type: [String], default: [] },
    subscribers: { type: [String], default: [] },

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
        .then((result) => {
            return result.toJSON();
        });
};

exports.nOnline = (id) => {
    Group.aggregate([{ $match: { _id: id } }, { $project: { nOnline: { $size: '$peopleOnline' }, nOnline: 1 } }])
        .then(data => {
            res.status(200).send(data);
        });
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

exports.profilePos = (groupId) => {
    return new Promise((resolve, reject) => {
        
    });
};

exports.isSub = (groupId, userId) => {
    return new Promise((resolve, reject) => {
        Group.findById(groupId, { subscribers: { $in: [userId] } }, function (err, group) {
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
        .then(profiles => {
            data.features = profiles
            res.status(200).send(data);
        });
};