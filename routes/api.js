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

	Group.find({ name: { "$regex": new RegExp("^" + search.toLowerCase(), "i") } }).limit(20)
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


module.exports = router
