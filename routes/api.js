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
