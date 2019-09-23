const express = require('express');
const router = express.Router()
const crypto = require('crypto');


const Profile = require("../models/Profile")
const Group = require("../models/Group")
const GroupMessages = require("../models/GroupMessages")
const Question = require("../models/Question")
const Answer = require("../models/Answer")
// const Cities = require("../models/Cities")


function sha256(p) {
	return crypto.createHash('sha256').update(p).digest('base64');
}
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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

router.post('/profile/nickname', (req, res) => {
	const nick = req.body.nickname
	Profile.findOne({ nickname: nick }, { _id: 0, password: 0, savedGroup: 0, savedQuestion: 0 })
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

router.post('/profile/update', (req, res) => {
	const nick = req.body.search.nickname
	var continua = true
	Profile.find({ nickname: nick })
		.then(profiles => {
			if (profiles.length === 0) {
				res.json({
					confirmation: 'fail',
					message: 'User ' + nick + ' does not exist'
				})
				continua = false
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			continua = false
		})
	
	if (continua === true){
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
		})
})

// res_profile = profiles.filter(function (item) { return (item.fake_position.x > search_x - 10 && item.fake_position.x < search_x + 10) && (item.fake_position.y > search_y - 10 && item.fake_position.y < search_y + 10); })

router.post('/profile/allProfiles', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y
	const range_search = Math.pow(query.range, 2)

	let data = { "type": "FeatureCollection",
				"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
				"features": [] }

	Profile.find({ 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } }, { _id: 0, nickname: 1, pos: 1, fakePos: 1 })
		.then(profiles => {
			for (let i = 0; i < profiles.length; ++i) {
				let x = profiles[i]['pos']['x']
				let y = profiles[i]['pos']['y']
				// let fakeX = profiles[i]['fakePos']['x']
				// let fakeY = profiles[i]['fakePos']['y']

				let notInsideCircle = (Math.pow(x - search_x, 2) + Math.pow(y - search_y, 2)) > range_search
				if (notInsideCircle) continue

				let data2 = {
					"type": "Feature",
					"properties": {
						'nickname': profiles[i]['nickname'],
						'name': profiles[i]['name'],
						'surname': profiles[i]['surname'],
						"mag": 2.0
					},
					"geometry": { "type": "Point", "coordinates": [x, y] }
				}
				data.features.push(data2)

				// let data2 = { 'coordinates': [x, y], 'nickname': profiles[i]['nickname'] }
				// data.push(data2)
			}
			res.json({
				confirmation: 'success',
				profiles: data,
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
	
	// TODO { pos: 1, _id: 0 } , non dare la password, e forse { online: true }
	// Profile.find({ online: true }, { pos: 1, _id: 0 })
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
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/profile/update', (req, res) => {
	const query = req.body
	const search = query.search
	const update = query.update

	Profile.updateOne(search, update)
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

router.post('/group/allGroups', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y
	const range_search = Math.pow(query.range, 2)

	let data = {
		"type": "FeatureCollection",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": []
	}
	Group.find({ 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } }, {_id:0, name:1, pos:1})
		.then(groups => {
			for (let i = 0; i < groups.length; ++i) {
				let x = groups[i]['pos']['x']
				let y = groups[i]['pos']['y']

				// (6-1)*((2-0)/(200-0)) + 1
				// https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range

				let notInsideCircle = (Math.pow(x - search_x, 2) + Math.pow(y - search_y, 2)) > range_search
				if (notInsideCircle) continue

				let data2 = {
					"type": "Feature",
					"properties": {
						'name': groups[i]['name'],
						"mag": 2.0
					},
					"geometry": { "type": "Point", "coordinates": [x, y] }
				}
				data.features.push(data2)
			}
			res.json({
				confirmation: 'success',
				groups: data,
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
	var continua = true

	Group.find({ name: name })
		.then(group => {
			if (group.length > 0) {
				res.json({
					confirmation: 'fail',
					message: 'Group ' + name + ' already exist'
				})
				continua = false
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			continua = false
		})

	if(continua === true){
		Group.create({ name: name, pos: pos })
			.then(group => {
				res.json({
					confirmation: 'success',
					data: group,
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


router.post('/group/updateOnline', (req, res) => {
	const query = req.body
	// {search: {name: }, update: {$inc:{nOnline: 1}, $push: {peopleOnline : {nickname: , id} }}}
	// {search: {name: }, update: {$inc:{nOnline: -1}, $pull: {peopleOnline : {nickname: , id} }}}
	const search = query.search
	const update = query.update
	const extra = query.extra

	Group.updateMany(search, update, extra)
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

router.post('/group/peopleOnline', (req, res) => {
	const name = req.body.name

	Group.find({ name: name }, { peopleOnline: 1, _id: 0 })
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

	Group.aggregate([{ $match: { name: name } }, { $project: { nOnline: { $size: '$peopleOnline' } } }])
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

router.post('/group/subscribe', (req, res) => {
	const namegroup = req.body.name
	const nickname = req.body.nick

	Group.find({ name: namegroup, subscribers: { $in: [nickname] }})
		.then(isSub => {
			if (isSub.length > 0){
				res.json({
					confirmation: 'success',
					data: "isSub",
				})
			} else {
				res.json({
					confirmation: 'success',
					data: "isNotSub",
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

router.post('/group/updateSub', (req, res) => {
	const query = req.body
	const nick = query.nick
	const groupname = query.name

	Group.updateOne({ name: groupname }, { $addToSet: { subscribers: nick } })
		.then(group => {
			res.json({
				confirmation: 'success',
			})
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
		})
})

router.post('/group/showOnMap', (req, res) => {
	const query = req.body
	const groupname = query.name

	let data = {
		"type": "FeatureCollection",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": []
	}

	Group.findOne({ name: groupname }, { subscribers: 1 })
		.then(group => {
			var subs = group['subscribers']

			var prom1 = new Promise(function (resolve, reject) {
				if (subs.length === 0) {
					resolve()
				}
				for (let a = 0; a < subs.length; ++a) {
					Profile.findOne({ nickname: subs[a], 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } }, { pos: 1 }).then(profile => {
						let x = profile['pos']['x']
						let y = profile['pos']['y']
						let data2 = {
							"type": "Feature",
							"properties": {
								'nickname': subs[a],
								'name': profile['name'],
								'surname': profile['surname'],
								"mag": 1.0
							},
							"geometry": { "type": "Point", "coordinates": [x, y] }
						}
						data.features.push(data2)
						resolve();
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
					subscribers: data,
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
	const limit = req.body.limit

	GroupMessages.find({ name_group: name }, { sender: 1, time: 1, message: 1, _id: 0 }).sort({ 'time': 'desc' }).limit(limit)
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
	const lastTime = req.body.lastTime

	GroupMessages.find({ name_group: name, time: { $gt: lastTime } }, { time: 1, _id: 0 }).sort({ 'time': 'desc' }).limit(1)
		.exec(function (err, message) {
			res.json({
				confirmation: 'success',
				messages: message,
			})
		});
})

router.post('/chat/write', (req, res) => {
	const name = req.body.name
	const sender = req.body.sender
	const message = req.body.message
	const time = req.body.time

	var continua = true

	Group.find({ name: name})
		.then(groups => {
			if (groups.length === 0) {
				res.json({
					confirmation: 'fail',
					message: "This groups doesn't exist"
				})
				continua = false
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			continua = false
		})

	if (continua === true){
		GroupMessages.create({ name_group: name, sender: sender, time: time, message: message })
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
	}
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
	const title = req.body.title
	let continua = true
	Question.find({ title: title })
		.then(question => {
			if (question.length > 0) {
				res.json({
					confirmation: 'fail',
					message: 'question ' + title + ' already exist'
				})
				continua = false
			}
		})
		.catch(err => {
			res.json({
				confirmation: 'fail',
				message: err.message
			})
			continua = false
		})

	if (continua === true) {
		Question.create(req.body)
			.then(question => {
				res.json({
					confirmation: 'success',
					data: question,
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

router.post('/question/allQuestions', (req, res) => {
	const query = req.body
	const search_x = query.x
	const search_y = query.y
	const range_search = Math.pow(query.range, 2)

	var timestampNow = Date.now()

	let data = {
		"type": "FeatureCollection",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": []
	}
	Question.find({ 'pos.x': { $ne: 0 }, 'pos.y': { $ne: 0 } }, { _id: 0, title: 1, pos: 1, time: 1 })
		.then(questions => {
			for (let i = 0; i < questions.length; ++i) {
				let x = questions[i]['pos']['x']
				let y = questions[i]['pos']['y']
				
				let notInsideCircle = (Math.pow(x - search_x, 2) + Math.pow(y - search_y, 2)) > range_search
				if (notInsideCircle) continue

				// 3600000 = 1000 * 60 * 60 
				if (Math.floor((timestampNow - questions[i]['time']) / 3600000) > 24) continue

				// https://stats.stackexchange.com/questions/281162/scale-a-number-between-a-range
				// (6 - 2.5) * ((questions[i]['vote'] - 0) / (500 - 0)) + 2.5

				let data2 = {
					"type": "Feature",
					"properties": {
						'title': questions[i]['title'],
						'details': questions[i]['details'],
						"mag": 2.0,
					},
					"geometry": { "type": "Point", "coordinates": [x, y] }
				}
				data.features.push(data2)
			}
			res.json({
				confirmation: 'success',
				questions: data,
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
	Question.findOne({ title: title})
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

	Question.updateOne({ _id: search }, { $addToSet: { whoVoted: nick } })
		.then(question => {
			if (question["nModified"] === 1) {
				Question.updateOne({ _id: search }, update)
					.then(question => {
						res.json({
							confirmation: 'success',
							data: question,
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
	Answer.find({ title: title }).sort({ level: 'asc', vote: 'desc', time: 'asc' })
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

	Answer.updateOne({ _id: search }, { $addToSet: { whoVoted: nick } })
		.then(answer => {
			if (answer["nModified"] === 1) {
				Answer.updateOne({ _id: search }, update)
					.then(answer => {
						res.json({
							confirmation: 'success',
							data: answer,
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
	search = escapeRegExp(search)

	// .sort({ "score": { "$meta": "textScore" }, vote: 'desc', time: 'desc', views: 'desc'})
	// Question.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
	// 	"score": { "$meta": "textScore" }
	// })
	Question.find({
		"$or": [
			{ title: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
			{ details: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
			{ details: { "$regex": new RegExp("^[#]" + search.toLowerCase(), "i") } }
		]
		}).limit(20)
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

router.post('/search/group', (req, res) => {
	const search = req.body.search
	search = escapeRegExp(search)

	// Group.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
	// 	"score": { "$meta": "textScore" }
	// })

	Group.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }).limit(10)
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

router.post('/search/profile', (req, res) => {
	const search = req.body.search
	search = escapeRegExp(search)

	// Profile.find({ "$text": { "$search": search } }, { "score": { "$meta": "textScore" } }).sort({
	// 	"score": { "$meta": "textScore" }
	// })
	Profile.find({
		"$or": [
			{ nickname: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
			{ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } },
			{ surname: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }
		]
	}).limit(20)
		.then(profiles => {
			if (profiles.length === 0) {
				res.json({
					confirmation: 'success',
					profile: [],
				})
			} else {
				var prom1 = new Promise(function (resolve, reject) {
					if (profiles.length === 0) {
						resolve()
					}
					for (let a = 0; a < profiles.length; ++a) {
						Profile.findById(profiles[a]["_id"], { nickname: 1 }).then(profile2 => {
							resolve({ nickname: profile2['nickname'], name: profile2['name'], surname: profile2['surname'], _id: profile2['_id'] });
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
					})
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
*         CITIES         *
**************************/

router.post('/cities/allCities', (req, res) => {
	let data = {
		"type": "FeatureCollection",
		"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
		"features": []
	}

	Cities.find()
		.then(cities => {
			for (let i = 0; i < cities.length; ++i) {
				// console.log(cities[i]['lng'], cities[i]['lat'])
				let data2 = {
					"type": "Feature",
					"properties": {
						'country': cities[i]['country'],
						'name': cities[i]['name'],
						"mag": 2.0
					},
					"geometry": { "type": "Point", "coordinates": [cities[i]['lng'], cities[i]['lat']] }
				}
				data.features.push(data2)
			}

			res.json({
				confirmation: 'success',
				cities: data,
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
