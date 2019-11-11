const express = require('express');
const multer = require('multer');
const uuid4 = require('uuid4');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage, limits: { fields: 1, fileSize: 5 * 1024 * 1024, files: 1, parts: 2 } });

const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
var db;
const { Readable } = require('stream');

MongoClient.connect('mongodb://localhost:27017/photo', (err, database) => {
    db = database;
});

photoRoute.get('/photo/:photoID', (req, res) => {
    var photoID = new ObjectID(req.params.photoID);

    let bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'photos'
    });

    let downloadStream = bucket.openDownloadStream(photoID);
    downloadStream.on('data', (chunk) => {
        res.write(chunk);
    });
    downloadStream.on('error', () => {
        res.sendStatus(404);
    });
    downloadStream.on('end', () => {
        res.end();
    });
});

photoRoute.post('/photo/upload', (req, res) => {
    upload.single('photo')(req, res, (err) => {
        if (err) return res.status(404);
        
        const readablePhotoStream = new Readable();
        readablePhotoStream.push(req.file.buffer);
        readablePhotoStream.push(null);

        let bucket = new mongodb.GridFSBucket(db, {
            bucketName: 'photos'
        });

        let uploadStream = bucket.openUploadStream(uuid4());
        let id = uploadStream.id;
        readablePhotoStream.pipe(uploadStream);
        uploadStream.on('error', () => {
            return res.status(500);
        });
        uploadStream.on('finish', () => {
            return res.status(201).send({ id: id });
        });
    });
});