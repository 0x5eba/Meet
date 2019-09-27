const GroupController = require('./groups.model');
const getProfilePosFromProfile = require('../profiles/profiles.model')['profilePos']
const showSubsOnMapFromProfile = require('../profiles/profiles.model')['subsOnMap']
const crypto = require('crypto');

exports.insert = (req, res) => {
    req.body = {
        name: req.body.name,
        pos: req.body.pos,
    }
    GroupController.createGroup(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        });
};

exports.uniqueName = (req, res, next) => {
    GroupController.findByName(req.body.name)
        .then((group) => {
            if (group) {
                res.status(403).send({ errors: ['Name already token'] });
            } else {
                return next();
            }
        })
        .catch(err => {
            res.status(403).send()
        })
}

exports.list = (req, res) => {
    GroupController.list()
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    GroupController.findById(req.params.groupId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.getByIdPeopleOnline = (req, res) => {
    GroupController.peopleOnline(req.params.groupId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.getByIdnOnline = (req, res) => {
    GroupController.nOnline(req.params.groupId)
};

exports.patchById = (req, res) => {
    let type = req.body.type
    if (type === "peopleOnline") {
        if (req.body.operation === "addToSet") {
            GroupController.patchGroupAddToSet(req.params.groupId, req.params.userId, "peopleOnline")
                .then((result) => {
                    res.status(204).send({});
                });
        } 
        else if (req.body.operation === "pullToSet") {
            GroupController.patchGroupPullToSet(req.params.groupId, req.params.userId, "peopleOnline")
                .then((result) => {
                    res.status(204).send({});
                });
        }
    } 
    else if (type === "subscribers") {
        GroupController.patchGroupAddToSet(req.params.groupId, req.params.userId, "subscribers")
            .then((result) => {
                res.status(204).send({});
            });
    }
};

exports.removeById = (req, res) => {
    GroupController.removeById(req.params.groupId)
        .then((result)=>{
            res.status(204).send({});
        });
};

exports.getProfilePos = (req, res) => {
    getProfilePosFromProfile(req.params.userId)
        .then((pos) => {
            if (!pos) {
                res.status(403).send({ errors: ['User not found'] });
            } else {
                req.body.pos = pos;
                return next();
            }
        })
        .catch(err => {
            res.status(403).send()
        })
};

exports.getIsSub = (req, res) => {
    GroupController.isSub(req.params.groupId, req.params.userId)
        .then((result) => {
            if(result){
                console.log("getIsSub", result)
                res.status(201).send();
            } else {
                res.status(204).send();
            }
        });
};

exports.allGroups = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    GroupController.findByPos(search_x, search_y, range_search, res)
};

exports.getAllSubs = (req, res) => {
    GroupController.subscribers(req.params.groupId)
        .then((subs) => {
            if (!subs) {
                res.status(403).send({ errors: ['Group not found'] });
            } else {
                req.body.subs = subs;
                return next();
            }
        })
        .catch(err => {
            res.status(403).send()
        })
};

exports.getShowSubs = (req, res) => {
    showSubsOnMapFromProfile(req.body.subs, res)
};