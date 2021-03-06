const fs = require('fs');
const express = require('express');
var cors = require('cors');
const app = express()
app.use(cors())
const router = express.Router()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
// app.use(bodyParser.json({ limit: '5mb' }))
// app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static(__dirname + '/public/'));
// app.use(bodyParser.urlencoded({ extended: false }));

const AuthorizationRouter = require('./models/authorization/routes.config');
const UsersRouter = require('./models/profiles/routes.config');
const GroupRouter = require('./models/groups/routes.config');
const QuestionRouter = require('./models/questions/routes.config');
const ChatRouter = require('./models/chat/routes.config');


ChatRouter.routesConfig(app);
AuthorizationRouter.routesConfig(app);
GroupRouter.routesConfig(app);
QuestionRouter.routesConfig(app);
UsersRouter.routesConfig(app);

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

const dbRoute = 'mongodb://localhost:27017/meet';
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
mongoose.connect(dbRoute, { useNewUrlParser: true });
let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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
router.get('/chat', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/chat.html'));
});
// router.get('/chat', function (req, res) {
// 	res.sendFile(path.join(__dirname + '/views/chat.html'));
// });

app.use('/', router)

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
app.listen(process.env.PORT || config.port, config.ip, () => {
	console.log("http://" + config.ip + ":" + config.port)
})

module.exports = {
	app,
}

require("./server/websocket.js")