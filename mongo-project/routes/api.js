const express = require('express');
const router = express.Router()
const crypto = require('crypto');


const Profile = require("../models/Profile")
const Group = require("../models/Group")
const GroupMessages = require("../models/GroupMessages")
const Question = require("../models/Question")
const Answer = require("../models/Answer")

function sha256(p) {
	return crypto.createHash('sha256').update(p).digest('base64');
}

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
	Profile.findOne({ nickname: nick }, { _id: 1 })
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

router.post('/profile/login', (req, res) => {
	const nick = req.body.nickname
	const password = req.body.password
	Profile.findOne({ nickname: nick, password: password }, { _id: 1 })
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

router.post('/profile/getSaved', (req, res) => {
	const nick = req.body.nick
	Profile.findOne({ nickname: nick }, { _id: 0, savedGroup: 1, savedQuestion: 1 })
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
				profile: profile,
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

// router.get('/profile/remove/:id', (req, res) => {
// 	// const id = req.query.id
// 	const id = req.params.id

// 	Profile.findByIdAndRemove(id)
// 		.then(data => {
// 			res.json({
// 				confirmation: 'success',
// 				data: id + ' removed',
// 			})
// 		})
// 		.catch(err => {
// 			res.json({
// 				confirmation: 'fail',
// 				message: err.message
// 			})
// 		})
// })

router.post('/profile/create', (req, res) => {
	const nickname = req.body.nickname
	const password = req.body.password
	const name = req.body.name
	const surname = req.body.surname
	Profile.find({ nickname: nickname })
		.then(profiles => {
			if (profiles.length > 0) {
				res.json({
					confirmation: 'fail',
					message: 'User ' + nickname + ' already exist'
				})
			} else {
				Profile.create({ nickname: nickname, password: password, name: name, surname: surname })
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
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			return;
		})
})

router.post('/profile/allProfiles', (req, res) => {
	// {
	// 	"type": "FeatureCollection", "features": [
	// 		{
	// 			"type": "Feature",
	// 			"properties": { "scalerank": 9, "type": "small", "name": "Sahnewal", "abbrev": "LUH", "location": "terminal", "gps_code": "VILD", "iata_code": "LUH", "wikipedia": "http://en.wikipedia.org/wiki/Sahnewal_Airport", "natlscale": 8, "featureclass": "Airport" },
	// 			"geometry": { "type": "Point", "coordinates": [75.95707224036518, 30.850359856170176] }
	// 		},]
	// }

	Profile.find({ online: true }, { pos: 1, _id: 0 })
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

router.post('/profile/update/saved', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update
	const extra = query.extra

	Profile.updateOne(search, update, extra)
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
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

router.post('/profile/update/status', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update

	Profile.updateOne(search, update)
		.then(profile => {
			res.json({
				confirmation: 'success',
				data: profile,
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

/*************************
*           POS          *
**************************/

router.post('/pos/profiles', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y

	// TODO invece di calcolare io il +- 10 della pos, fallo calcolare nel find, con i $gt etc.
	Profile.find({ online: true })
		.then(profiles => {
			var real_pos = profiles.filter(function (item) { return (item.pos.x > search_x - 10 && item.pos.x < search_x + 10) && (item.pos.y > search_y - 10 && item.pos.y < search_y + 10); })
			res.json({
				confirmation: 'success',
				profiles: real_pos,
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

	// { $project: { nOnline: { $size: '$peopleOnline' } } }

	// Group.aggregate([{
	// 		$addFields: {
	// 			nOnline: { $size: '$peopleOnline' }
	// 		}
	// 	},
	// 	{ $sort: { nOnline: 'desc' } }
	// ]).then(groups => {
	// 		res.json({
	// 			confirmation: 'success',
	// 			groups: groups,
	// 			query: query,
	// 		})
	// 	})
	// 	.catch(err => {
	// 		res.json({
	// 			confirmation: 'fail',
	// 			message: err.message
	// 		})
	// 	})

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


router.post('/pos/questions', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y

	Question.find().sort({vote: 'desc', time: 'desc'})
		.then(question => {
			let res_question = question.filter(function (item) { return (item.pos.x > search_x - 10 && item.pos.x < search_x + 10) && (item.pos.y > search_y - 10 && item.pos.y < search_y + 10); })
			res.json({
				confirmation: 'success',
				questions: res_question,
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

	Group.aggregate([{ $match: { name: name, pos: pos } }, { $project: { nOnline: { $size: '$peopleOnline' } } }])
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

router.post('/group/getGroup', (req, res) => {
	const title = req.body.title
	const pos = req.body.pos
	Group.findOne({ title: title, pos: pos })
		.then(group => {
			res.json({
				confirmation: 'success',
				group: group,
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

/*************************
*        QUESTION        *
**************************/

router.get('/questions', (req, res) => {
	Question.find()
		.then(questions => {
			res.json({
				confirmation: 'success',
				data: questions,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/question/create', (req, res) => {
	Question.create(req.body)
		.then(question => {
			res.json({
				confirmation: 'success',
				data: question,
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

router.get('/question/allQuestions', (req, res) => {
	Question.find({}, { pos: 1, _id: 0 })
		.then(questions => {
			res.json({
				confirmation: 'success',
				questions: questions,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/question/getQuestion', (req, res) => {
	const title = req.body.title
	const pos = req.body.pos
	Question.findOne({ title: title, pos: pos })
		.then(question => {
			res.json({
				confirmation: 'success',
				question: question,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/question/updateVote', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update
	const nick = query.nick

	Question.updateOne({ _id: search }, { $addToSet: { whoVoted: nick } }, { new: true })
		.then(question => {
			if (question["nModified"] == 1) {
				Question.updateOne({ _id: search }, update)
					.then(question => {
						res.json({
							confirmation: 'success',
							data: question,
							query: req.body
						})
					})
					.catch(err => {
						res.json({
							confirmation: 'fail',
							message: err.message
						})
					})

			} else {
				res.json({
					confirmation: 'fail',
					message: "You already voted",
					data: question,
				})
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/question/updateView', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update

	Question.updateOne(search, update)
		.then(question => {
			res.json({
				confirmation: 'success',
				data: question,
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
*         ANSWERS        *
**************************/

router.post('/answer/group', (req, res) => {
	const title = req.body.title
	const pos = req.body.pos
	Answer.find({ title: title, pos: pos }).sort({ level: 'asc', vote: 'desc', time: 'asc' })
		.then(answers => {
			res.json({
				confirmation: 'success',
				answers: answers,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/answer/create', (req, res) => {
	Answer.create(req.body)
		.then(answer => {
			res.json({
				confirmation: 'success',
				data: answer,
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

router.get('/answers', (req, res) => {
	Answer.find()
		.then(answers => {
			res.json({
				confirmation: 'success',
				answers: answers,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/answer/updateVote', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update
	const nick = query.nick

	Answer.updateOne({ _id: search }, { $addToSet: { whoVoted: nick } }, { new: true })
		.then(answer => {
			if (answer["nModified"] == 1) {
				Answer.updateOne({ _id: search }, update)
					.then(answer => {
						res.json({
							confirmation: 'success',
							data: answer,
							query: req.body
						})
					})
					.catch(err => {
						res.json({
							confirmation: 'fail',
							message: err.message
						})
					})
			} else {
				res.json({
					confirmation: 'fail',
					message: "You already voted",
					data: answer,
				})
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

/*************************
*         SEARCH         *
**************************/

router.post('/search/question', (req, res) => {
	const search = req.body.search
	// .sort({ "score": { "$meta": "textScore" }, vote: 'desc', time: 'desc', views: 'desc'})
	Question.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
		"score": { "$meta": "textScore" }
	})
		.then(question => {
			res.json({
				confirmation: 'success',
				question: question,
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

router.post('/search/group', (req, res) => {
	const search = req.body.search
	Group.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
		"score": { "$meta": "textScore" }
	})
		.then(group => {
			res.json({
				confirmation: 'success',
				group: group,
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

router.post('/search/profile', (req, res) => {
	const search = req.body.search
	Profile.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
		"score": { "$meta": "textScore" }
	})
		.then(profiles => {

			var prom1 = new Promise(function (resolve, reject) {
				for (let a = 0; a < profiles.length; ++a) {
					Profile.findById(profiles[a]["_id"], { nickname: 1 }).then(profile2 => {
						resolve({ nickname: profile2['nickname'], name: profile2['name'], surname: profile2['surname'], _id: profile2['_id']});
					})
					.catch(err => {
						console.log(err);
					})
				}
			})
			
			var promisesArray = [prom1];
			Promise.all(promisesArray).then(values => {
				res.json({
					confirmation: 'success',
					profile: values,
					query: req.body
				})
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
