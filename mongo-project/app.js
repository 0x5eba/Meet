const express = require('express');
var cors = require('cors');
const app = express()
app.use(cors())
const router = express.Router()
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public/'));
// app.use(bodyParser.urlencoded({ extended: false }));



const api = require('./routes/api')

const dbRoute = 'mongodb://localhost:27017/test';
const mongoose = require('mongoose')
mongoose.set('useFindAndModify', false);
mongoose.connect(dbRoute, { useNewUrlParser: true });
let db = mongoose.connection;
db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const path = require('path');
router.get('/editor', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/editor.html'));
});
router.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/views/test.html'));
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

const fs = require('fs');
const FroalaEditor = require(path.join(__dirname + '/public/wysiwyg-editor-node-sdk/lib/froalaEditor.js'));
router.post('/upload_image', function (req, res) {
	FroalaEditor.Image.upload(req, '/public/uploads/', function (err, data) {
		if (err) {
			return res.send(JSON.stringify(err));
		}
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

// set routes
app.use('/', router)
app.use('/api', api) // sample API Routes


var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

app.listen(process.env.PORT || config.port, config.ip, () => {
	console.log("http://" + config.ip + ":" + config.port)
})

module.exports = app