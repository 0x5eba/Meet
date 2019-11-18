const mongoose = require('mongoose')
require('mongoose-double')(mongoose);
mongoose.set('useCreateIndex', true);
var SchemaTypes = mongoose.Schema.Types;

const ProfileModel = new mongoose.Schema({
    nickname: { type: String, trim: true, require: true, minlength: 4 },
    password: { type: String, require: true },
    name: { type: String, trim: true, default: '' },
    surname: { type: String, trim: true, default: '' },
    bio: { type: String, default: '' },
    pic: { type: String, default: '' },
    pos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    fakePos: { x: { type: SchemaTypes.Double, default: 0 }, y: { type: SchemaTypes.Double, default: 0 } },
    lastSeen: { type: Number, default: 0 },
    savedGroup: { type: [String], default: [] },
    savedQuestion: { type: [String], default: [] },
    chats: { type: [String], default: [] } // chat ids
})

const Grid = require('gridfs-stream');
const mongoURI = 'mongodb://localhost:27017/photo';
const conn = mongoose.createConnection(mongoURI);
var gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})


const Profile = mongoose.model('Profile', ProfileModel);

exports.userInfoForAuthenitcate = (nickname) => {
    return new Promise((resolve, reject) => {
        Profile.findOne({ nickname: nickname }, { password: 1, nickname: 1, _id: 1 }, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
};

exports.findByNickname = (nickname) => {
    return new Promise((resolve, reject) => {
        Profile.findOne({ nickname: nickname }, { password: 0, fakePos: 0, savedGroup: 0, savedQuestion: 0 }, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
};

exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        Profile.findById(id, { password: 0, permissionLevel: 0 }, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
};

exports.getNickname = (id) => {
    return new Promise((resolve, reject) => {
        Profile.findById(id, { nickname: 1 }, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
};

exports.createUser = (userData) => {
    return new Promise((resolve, reject) => {
        const user = new Profile(userData);
        user.save(function (err, newuser) {
            if (err) return reject(err);
            resolve(newuser);
        });
    })
};

exports.list = () => {
    return new Promise((resolve, reject) => {
        Profile.find({}, { password: 0, permissionLevel: 0 }, function (err, users) {
            if (err) reject(err);
            resolve(users);
        })
    });
};

exports.patchUser = (id, userData) => {
    return new Promise((resolve, reject) => {
        Profile.findById(id, function (err, user) {
            if (err) reject(err);
            for (let i in userData) {
                if (['name', 'surname', 'pos', 'bio', 'fakePos', 'lastSeen'].includes(i)){
                    user[i] = userData[i];
                }
            }
            user.save(function (err, updatedUser) {
                if (err) return reject(err);
                return resolve(updatedUser);
            });
        });
    })
};

exports.patchUserBookmark = (userId, name, type) => {
    return new Promise((resolve, reject) => {
        Profile.findByIdAndUpdate(userId, { $addToSet: { [type]: name }}, function (err, user) {
            if (err) reject(err);
            resolve(user);
        });
    })
};

exports.removeById = (userId) => {
    return new Promise((resolve, reject) => {
        Profile.remove({_id: userId}, (err, profile) => {
            if (err) reject(err);
            resolve(profile);
        });
    });
};

exports.findByIdGetPos = (id) => {
    return new Promise((resolve, reject) => {
        Profile.findById(id, { pos: 1, fakePos: 1 }, (err, profile) => {
            if (err) reject(err);
            resolve(profile);
        });
    });
};

exports.findByPos = (search_x, search_y, range_search, res) => {
    let data = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": []
    }

    Profile.aggregate([
        // { "$redact": {
        //     "$cond": {
        //         "if": { "$gte": ["$circle", range_search] },
        //         "then": "$$PRUNE",
        //         "else": "$$KEEP"
        //         }
        //     }
        // },
        { $project: {
                circle: { $sum: [ 
                        { $multiply: [{ $subtract: ["$pos.x", search_x] }, { $subtract: ["$pos.x", search_x] }] }, 
                        { $multiply: [{ $subtract: ["$pos.y", search_y] }, { $subtract: ["$pos.y", search_y] }] }
                    ]},
                "type": "Feature",
                "properties": {
                    'nickname': "$nickname",
                    'name': "$name",
                    'lastSeen': "$lastSeen",
                    'surname': "$surname",
                    'id': "$_id",
                    "mag": { $convert: { input: "2", to: "double" } },
                },
                "geometry": { "type": "Point", "coordinates": ["$pos.x", "$pos.y"] }
            }, 
        }, 
        { "$match": { "circle": { $lte: range_search }, 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } } }
    ])
        .then(profiles => {
            data.features = profiles
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting profiles near you" })
        })
};


exports.subsOnMap = (listIds, res) => {
    let data = {
        "type": "FeatureCollection",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": []
    }

    listIds = listIds['subscribers']

    Profile.aggregate([
        {
            $project: {
                "type": "Feature",
                "properties": {
                    'nickname': "$nickname",
                    'name': "$name",
                    'surname': "$surname",
                    'id': "$_id",
                    "mag": { $convert: { input: "1", to: "double" } },
                },
                "geometry": { "type": "Point", "coordinates": ["$pos.x", "$pos.y"] }
            },
        },
        { "$match": { 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 }, 'id': { $in: listIds } } }
    ])
        .then(profiles => {
            data.features = profiles
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting subscriber" })
        })
};

exports.searchProfiles = (search) => {
    return new Promise((resolve, reject) => {
        Profile.find({
            "$or": [
                { nickname: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
                { name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
                { surname: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }
            ]
        }, { nickname: 1, name: 1, surname: 1 }).limit(20).exec(function (err, profiles) {
            if (err) reject(err);
            resolve(profiles);
        });
    })
}

exports.uploadPic = (id, filename) => {
    return new Promise((resolve, reject) => {
        Profile.findById(id, function (err, user) {
            if (err) reject(err);

            if (user['pic'] !== ''){
                gfs.remove({ filename: user['pic'], root: 'uploads' }, (err, gridStore) => {
                    if (err) return reject(err);
                    user['pic'] = filename
                    user.save(function (err, updatedUser) {
                        if (err) return reject(err);
                        return resolve(updatedUser);
                    });
                });
            } else {
                user['pic'] = filename
                user.save(function (err, updatedUser) {
                    if (err) return reject(err);
                    return resolve(updatedUser);
                });
            }
        });
    })
}

exports.getPic = (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).send({ err: "No file exists" });
        }
        const readstream = gfs.createReadStream(file.filename);
        res.header({ 'Content-type': "image/jpg" });
        readstream.on('error', () => {
            res.status(404).send({ err: "Error getting the file" });
        })
        readstream.pipe(res);

        readstream.on('end', function () {
            res.status(201).end()
        })
    });
}

const heapmap = require("../../server/heapmap")

function createDataForTs() {
    Profile.find({ 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } }, { pos: 1, _id: 0 })
        .then(profiles => {
            heapmap.createTsProfiles(profiles);
        })
        .catch(err => {
            console.log(err)
        })
}
setInterval(() => createDataForTs(), 300000); // 5 min
createDataForTs()

exports.getTsProfiles = () => {
    return new Promise((resolve, reject) => { 
        resolve(heapmap.getTsProfiles())
    })
}