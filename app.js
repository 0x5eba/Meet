const express = require('express');
var cors = require('cors');
const app = express()
app.use(cors())
const router = express.Router()
const fileupload = require('express-fileupload')
app.use(fileupload())
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public/'));
// app.use(bodyParser.urlencoded({ extended: false }));

const AuthorizationRouter = require('./models/authorization/routes.config');
const UsersRouter = require('./models/profiles/routes.config');
const GroupRouter = require('./models/groups/routes.config');
const QuestionRouter = require('./models/questions/routes.config');

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', 'https://sebastienbiollo.com');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.header('Access-Control-Expose-Headers', 'Content-Length');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
	if (req.method === 'OPTIONS') {
		return res.send(200);
	} else {
		return next();
	}
});

AuthorizationRouter.routesConfig(app);
UsersRouter.routesConfig(app);
GroupRouter.routesConfig(app);
QuestionRouter.routesConfig(app);

const dbRoute = 'mongodb://localhost:27017/meet';
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
mongoose.connect(dbRoute, { useNewUrlParser: true });
let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// const Cities = require("./models/Cities")
// const Countries = require("./models/Countries")
// const Languages = require("./models/Languages")

// const cities = require('cities.json')
// const countriesList = require('countries-list')
// const countries = countriesList['countries']
// const languages = countriesList['languagesAll']

// const collections = Object.keys(db.collections)
// if (!collections.includes('cities')){
// 	Cities.insertMany(cities)
// }
// if (!collections.includes('Countries')) {
// 	Countries.insertMany(countries)
// }
// if (!collections.includes('Languages')) {
// 	Languages.insertMany(languages)
// }

const path = require('path');
router.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/index.html'));
});
router.get('/login', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/login.html'));
});
router.get('/register', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/register.html'));
});
router.get('/question', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/question.html'));
});
router.get('/group', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/group.html'));
});
router.get('/profile', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/profile.html'));
});
router.get('/home', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/home.html'));
});
// router.get('/chat', function (req, res) {
// 	res.sendFile(path.join(__dirname + '/views/chat.html'));
// });

/*
const FroalaEditor = require(path.join(__dirname + '/public/wysiwyg-editor-node-sdk/lib/froalaEditor.js'));
router.post('/upload_image', function (req, res) {
	FroalaEditor.Image.upload(req, '/public/uploads/', function (err, data) {
		if (err) {
			return res.send(JSON.stringify(err));
		}
		console.log(data)
		data['link'] = data['link'].replace("/public", "")
		res.send(data);
	})
})
router.post('/delete_image', function (req, res) {
	FroalaEditor.Image.delete("/public" + req.body.src, function (err) {
		if (err) {
			return res.status(404).end(JSON.stringify(err));
		}
		return res.end();
	})
})
router.post('/upload_file', function (req, res) {
	FroalaEditor.File.upload(req, '/public/uploads/', function (err, data) {
		if (err) {
			return res.send(JSON.stringify(err));
		}
		data['link'] = data['link'].replace("/public", "")
		res.send(data);
	})
})
router.post('/delete_file', function (req, res) {
	FroalaEditor.File.delete("/public" + req.body.src, function (err) {
		if (err) {
			return res.status(404).end(JSON.stringify(err));
		}
		return res.end();
	})
})
*/

app.use('/', router)

// const api = require('./models/api')
// app.use('/api', api) // sample API Routes

const fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.listen(process.env.PORT || config.port, config.ip, () => {
	console.log("http://" + config.ip + ":" + config.port)
})

module.exports = app