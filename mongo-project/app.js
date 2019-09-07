const express = require('express');
var cors = require('cors');
const app = express()
app.use(cors())
const router = express.Router()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public/'));



const api = require('./routes/api')

const dbRoute = 'mongodb://localhost:27017/test';
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
mongoose.connect(dbRoute, { useNewUrlParser: true });
let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const path = require('path');
router.get('/index', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/index.html'));
});
router.get('/b', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/button.html'));
});
router.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/test.html'));
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

// set routes
app.use('/', router)
app.use('/api', api) // sample API Routes

const fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.listen(process.env.PORT || config.port, config.ip, () => {
	console.log("http://" + config.ip + ":" + config.port)
})

module.exports = app