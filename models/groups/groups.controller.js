const GroupController = require('./groups.model');
const getProfilePosFromProfile = require('../profiles/profiles.controller')['profilePos']
const showSubsOnMapFromProfile = require('../profiles/profiles.model')['subsOnMap']
const getProfileNicknameFromProfile = require('../profiles/profiles.model')['getNickname']
const crypto = require('crypto');
var escapeRegExp = require('lodash.escaperegexp');

exports.insert = (req, res) => {
    req.body = {
        name: req.body.name,
        pos: req.body.pos,
    }
    GroupController.createGroup(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid arguments for new group" })
        })
};

exports.uniqueName = (req, res, next) => {
    GroupController.findByName(req.body.name)
        .then((group) => {
            if (group) {
                res.status(403).send({ err: 'Name already taken' });
            } else {
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid nickname" })
        })
}

exports.getProfileNickname = (req, res, next) => {
    getProfileNicknameFromProfile(req.params.userId)
        .then((user) => {
            if (!user) {
                res.status(403).send({ err: 'User not found' });
            } else {
                req.body.nickname = user['nickname']
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error get group nickname" })
        })
};

exports.list = (req, res) => {
    GroupController.list()
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid list groups" })
        })
};

exports.getById = (req, res) => {
    GroupController.findById(req.params.groupId)
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid get group" })
        })
};

exports.getName = (req, res) => {
    GroupController.getNameById(req.params.groupId) 
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid get group" })
        })
}

exports.getByIdPeopleOnline = (req, res) => {
    GroupController.peopleOnline(req.params.groupId)
        .then((result) => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid get poeple online" })
        })
};

exports.getByIdnOnline = (req, res) => {
    GroupController.nOnline(req.params.groupId)
        .then((result) => {
            res.status(200).send(result[0]);
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid get number online" })
        })
};

exports.patchById = (req, res) => {
    let type = req.body.type
    if (type === "peopleOnline") {
        if (req.body.operation === "addToSet") {
            GroupController.patchGroupAddToSet(req.params.groupId, req.params.userId, "peopleOnline")
                .then((result) => {
                    res.status(201).send({});
                })
                .catch(err => {
                    res.status(403).send({ err: "Invalid add to people online" })
                })
        } 
        else if (req.body.operation === "pullToSet") {
            GroupController.patchGroupPullToSet(req.params.groupId, req.params.userId, "peopleOnline")
                .then((result) => {
                    res.status(201).send({});
                })
                .catch(err => {
                    res.status(403).send({ err: "Invalid remove to people online" })
                })
        }
    } 
    else if (type === "subscribers") {
        GroupController.patchGroupAddToSet(req.params.groupId, req.params.userId, "subscribers")
            .then((result) => {
                res.status(201).send({});
            })
            .catch(err => {
                res.status(403).send({ err: "Invalid add to subscribe" })
            })
    }
};

exports.removeById = (req, res) => {
    GroupController.removeById(req.params.groupId)
        .then((result)=>{
            res.status(201).send({});
        })
        .catch(err => {
            res.status(403).send({ err: "Invalid remove group" })
        })
};

exports.getProfilePos = (req, res, next) => {
    getProfilePosFromProfile(req.params.userId, req, res, next)
};

exports.getIsSub = (req, res) => {
    GroupController.isSub(req.params.groupId, req.params.userId)
        .then((result) => {
            if(result === null){
                res.status(201).send({});
            } else {
                res.status(201).send({'id': result});
            }
        })
        .catch(err => {
            res.status(403).send({err: "Error get is subscribe"})
        })
};

exports.allGroups = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    GroupController.findByPos(search_x, search_y, range_search, res)
};

exports.getAllSubs = (req, res, next) => {
    GroupController.subscribers(req.params.groupId)
        .then((subs) => {
            if (!subs) {
                res.status(403).send({ err: 'Group not found' });
            } else {
                req.body.subs = subs;
                return next();
            }
        })
        .catch(err => {
            res.status(403).send({ err: "Error get subscribers" })
        })
};

exports.getShowSubs = (req, res) => {
    showSubsOnMapFromProfile(req.body.subs, res)
};

exports.getMessagesWithLimit = (req, res) => {
    GroupController.messagesSorted(req.params.groupId)
        .then((result) => {
            messages = result['messages'].slice(-req.body.limit)
            res.status(201).send({messages: messages});
        })
        .catch(err => {
            res.status(403).send({err: "Error get messages"})
        })
};

exports.checkLastMessage = (req, res) => {
    GroupController.getLastMessageTimestamp(req.params.groupId, req.body.lastTime)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({err: "Error get last message"})
        })
};

exports.writeMessage = (req, res) => {
    GroupController.createMessages(req.params.groupId, req.params.userId, req.body.nickname, req.body.data, Date.now())
        .then((result) => {
            res.status(201).send({res: result});
        })
        .catch(err => {
            res.status(403).send({err: "Error send message"})
        })
};

exports.searchGroups = (req, res) => {
    search = escapeRegExp(req.body.search)
    GroupController.searchGroups(search)
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error on searching groups" })
        })
}

exports.getTsGroups = (req, res) => {
    GroupController.getTsGroups()
        .then((result) => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(403).send({ err: "Error getting heapmap" })
        })
}