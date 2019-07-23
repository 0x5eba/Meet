// Full Documentation - https://www.turbo360.co/docs
const vertex = require('vertex360')({ site_id: process.env.TURBO_APP_ID })

// const app = vertex.express() // initialize app


/*  
	Apps can also be initialized with config options as shown in the commented out example below. Options
	include setting views directory, static assets directory, and database settings. To see default config
	settings, view here: https://www.turbo360.co/docs 
*/

const config = {
	views: 'views', 		// Set views directory 
	static: 'public', 		// Set static assets directory
	db: { 					// Database configuration. Remember to set env variables in .env file: MONGODB_URI, PROD_MONGODB_URI
		url: 'mongodb://localhost/mongo-proj',
		type: 'mongo',
		onError: (err) => {
			console.log('DB Connection Failed!')
		},
		onSuccess: () => {
			console.log('DB Successfully Connected!')
		}
	}
}

const app = vertex.app(config) // initialize app with config options

const bodyParser = require('body-parser')
app.use(bodyParser.json())

// import routes
// const register = require('./routes/register')
const api = require('./routes/api')

const express = require('express');
const path = require('path');
const router = express.Router();
router.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/index.html'));
});
router.get('/register', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/register.html'));
});
router.get('/ask_question', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/question.html'));
});
router.get('/group', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/group.html'));
});

// set routes
app.use('/', router)
app.use('/api', api) // sample API Routes


module.exports = app