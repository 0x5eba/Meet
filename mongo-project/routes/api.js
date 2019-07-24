// Full Documentation - https://www.turbo360.co/docs
const turbo = require('turbo360')({ site_id: process.env.TURBO_APP_ID })
const vertex = require('vertex360')({ site_id: process.env.TURBO_APP_ID })
const router = vertex.router()
require('mongoose')

const Profile = require("../models/Profile")
const Group = require("../models/Group")
const GroupMessages = require("../models/GroupMessages")
const Question = require("../models/Question")
const Answer = require("../models/Answer")

/*************************
*       PROFILES         *
**************************/

router.get('/profiles', (req, res) => {
	Profile.find()
		.then(profiles => {
			res.json({
				confirmation: 'success',
				data: profiles,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/profile/getId', (req, res) => {
	const nick = req.body.nickname
	Profile.find({ nickname: nick }, { _id: 1 })
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/profile/id', (req, res) => {
	const id = req.body.id

	Profile.findById(id)
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

// const CircularJSON = require('circular-json');

router.post('/profile/update', (req, res) => {
	const nick = req.body.search.nickname
	Profile.find({ nickname: nick })
		.then(profiles => {
			if (profiles.length == 0) {
				res.json({
					confirmation: 'fail',
					message: 'User ' + nick + ' does not exist'
				})
				return
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return;
		})

	const query = req.body
	// {"search": {"online": "false"}, "update": {"$set":{"online": "true"}}, "extra":{"multi":"true"}}
	const search = query.search
	const update = query.update
	const extra = query.extra

	Profile.updateMany(search, update, extra)
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
				// query: CircularJSON.stringify(req),
				query: query
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.get('/profile/remove/:id', (req, res) => {
	// const id = req.query.id
	const id = req.params.id

	Profile.findByIdAndRemove(id)
		.then(data => {
			res.json({
				confirmation: 'success',
				data: id + ' removed',
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/profile/create', (req, res) => {
	const nick = req.body.nickname
	Profile.find({ nickname: nick })
		.then(profiles => {
			if (profiles.length > 0) {
				res.json({
					confirmation: 'fail',
					message: 'User ' + nick + ' already exist'
				})
				return
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return;
		})

	Profile.create(req.body)
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
				query: req.body
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

/*************************
*           POS          *
**************************/

router.post('/pos/allProfiles', (req, res) => {
	Profile.find({ online: true }, { real_position: 1, fake_position: 1, use_fake_position: 1, _id: 0 })
		.then(profiles => {
			res.json({
				confirmation: 'success',
				profiles: profiles,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/pos/profiles', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y

	var res_profile = []

	Profile.find({ use_fake_position: true, online: true })
		.then(profiles => {
			res_profile = profiles.filter(function (item) { return (item.fake_position.x > search_x - 10 && item.fake_position.x < search_x + 10) && (item.fake_position.y > search_y - 10 && item.fake_position.y < search_y + 10); })
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return
		})

	Profile.find({ use_fake_position: false, online: true })
		.then(profiles => {
			var real_pos = profiles.filter(function (item) { return (item.real_position.x > search_x - 10 && item.real_position.x < search_x + 10) && (item.real_position.y > search_y - 10 && item.real_position.y < search_y + 10); })
			res.json({
				confirmation: 'success',
				profiles: real_pos.concat(res_profile),
				query: query,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/pos/groups', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y

	Group.find()
		.then(groups => {
			let res_groups = groups.filter(function (item) { return (item.pos.x > search_x - 10 && item.pos.x < search_x + 10) && (item.pos.y > search_y - 10 && item.pos.y < search_y + 10); })
			res.json({
				confirmation: 'success',
				groups: res_groups,
				query: query,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

/*************************
*         GROUPS         *
**************************/

router.get('/groups', (req, res) => {
	Group.find()
		.then(groups => {
			res.json({
				confirmation: 'success',
				data: groups,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

// router.post('/group/id', (req, res) => {
// 	const name = req.body.name
// 	const pos = req.body.pos

// 	Group.find({ name: name, pos: pos }, {_id:1})
// 		.then(groupId => {
// 			res.json({
// 				confirmation: 'success',
// 				data: groupId,
// 			})
// 		})
// 		.catch(err => {
// 			res.json({
// 				confirmation: 'fail',
// 				message: err.message
// 			})
// 		})
// })

router.get('/group/allGroups', (req, res) => {
	Group.find({}, { pos: 1, _id: 0 })
		.then(groups => {
			res.json({
				confirmation: 'success',
				groups: groups,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/group/create', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos

	Group.find({ name: name, pos: pos })
		.then(group => {
			if (group.length > 0) {
				res.json({
					confirmation: 'fail',
					message: 'Group ' + name + ' already exist'
				})
				return
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return;
		})

	Group.create({ name: name, pos: pos })
		.then(group => {
			res.json({
				confirmation: 'success',
				data: group,
				query: req.body
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})


router.post('/group/updateOnline', (req, res) => {
	const query = req.body
	// {search: {name: , pos: }, update: {$inc:{nOnline: 1}, $push: {peopleOnline : {nickname: , id} }}}
	// {search: {name: , pos: }, update: {$inc:{nOnline: -1}, $pull: {peopleOnline : {nickname: , id} }}}
	const search = query.search
	const update = query.update
	const extra = query.extra

	Group.updateMany(search, update, extra)
		.then(groups => {
			res.json({
				confirmation: 'success',
				data: groups,
				query: query
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/group/peopleOnline', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos

	Group.find({ name: name, pos: pos }, { peopleOnline: 1, _id: 0 })
		.then(group => {
			res.json({
				confirmation: 'success',
				groups: group,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/group/nOnline', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos

	Group.aggregate([{ $match: { name: name, pos: pos } }, { $project: { nOnline: { $size: '$peopleOnline'} } }])
		.then(nOnline => {
			res.json({
				confirmation: 'success',
				nOnline: nOnline,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

/*************************
*     GROUP MESSAGES     *
**************************/

router.get('/chats', (req, res) => {
	GroupMessages.find()
		.then(groupMessages => {
			res.json({
				confirmation: 'success',
				data: groupMessages,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/chat/messages', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos
	const limit = req.body.limit

	GroupMessages.find({ name_group: name, pos: pos }, { sender: 1, time: 1, message: 1, _id: 0 }).sort({ 'time': 'desc' }).limit(limit)
		.exec(function (err, message) {
			if (err != null) {
				res.json({
					confirmation: 'fail',
					message: err.message
				})
			} else {
				res.json({
					confirmation: 'success',
					messages: message,
				})
			}
		});
})

router.post('/chat/update', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos
	const lastTime = req.body.lastTime

	GroupMessages.find({ name_group: name, pos: pos, time: { $gt: lastTime } }, { time: 1, _id: 0 }).sort({ 'time': 'desc' }).limit(1)
		.exec(function (err, message) {
			res.json({
				confirmation: 'success',
				messages: message,
			})
		});
})

router.post('/chat/write', (req, res) => {
	const name = req.body.name
	const pos = req.body.pos
	const sender = req.body.sender
	const message = req.body.message
	const time = req.body.time

	Group.find({ name: name, pos: pos })
		.then(groups => {
			if (groups.length == 0) {
				res.json({
					confirmation: 'fail',
					message: "This groups doesn't exist"
				})
				return
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return
		})

	GroupMessages.create({ name_group: name, pos: pos, sender: sender, time: time, message: message })
		.then(message => {
			res.json({
				confirmation: 'success',
				data: message,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

module.exports = router
