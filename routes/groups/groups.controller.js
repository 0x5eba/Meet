const GroupController = require('./groups.model');
const crypto = require('crypto');

exports.insert = (req, res) => {
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

// exports.patchById = (req, res) => {
//     GroupController.patchGroup(req.params.groupId, req.body)
//         .then((result) => {
//             res.status(204).send({});
//         });
// };

exports.removeById = (req, res) => {
    GroupController.removeById(req.params.groupId)
        .then((result)=>{
            res.status(204).send({});
        });
};

exports.allGroups = (req, res) => {
    let query = req.body
    let search_x = query.x
    let search_y = query.y
    let range_search = query.range * query.range // ^ 2

    GroupController.findByPos(search_x, search_y, range_search, res)
};