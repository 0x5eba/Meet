const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const app = express();
app.use(bodyParser.json());

const mongoURI = 'mongodb://localhost:27017/photo';
const conn = mongoose.createConnection(mongoURI);
var gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        res.json(files);
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ filename: req.file.filename });
});

// app.get('/files/:filename', (req, res) => {
//     gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//         if (!file || file.length === 0) {
//             return res.status(404).json({
//                 err: 'No file exists'
//             });
//         }
//         return res.json(file);
//     });
// });

app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        // Check if file
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        try {
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } catch {
            return res.status(404).json({
                err: 'error stream image'
            });
        }
    });
});

app.delete('/image/:filename', (req, res) => {
    gfs.deleteOne({ filename: req.params.filename, root: 'uploads' }, (err, gridStore) => {
        if (err) {
            return res.status(404).json({ err: err });
        }
        res.json({ res: "ok" });
    });
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));