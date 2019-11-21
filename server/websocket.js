var webSocketsServerPort = 1337;
var webSocketServer = require('websocket').server;

const ChatController = require("../models/chat/chat.controller.js")
const ProfilesController = require("../models/profiles/profiles.controller.js")


const jwt = require('jsonwebtoken')
const config = require('../models/common/config/env.config.js')
// const https = require('https');
const http = require('http');
const jwtSecret = config.jwtSecret



var server = http.createServer();
server.listen(webSocketsServerPort, function () {
    // console.log("Websocket listening on port " + webSocketsServerPort);
});
var wsServer = new webSocketServer({
    httpServer: server
});
var clients = {};

wsServer.on('request', function (request) {
    // console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    // if (request.origin !== "http://localhost:3001" || request.origin !== "https://sebastienbiollo.com"){
    //     return
    // }
    var connection = request.accept(null, request.origin);
    var userId = ""

    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            message = JSON.parse(message.utf8Data)

            if(message.type === "auth"){
                message = message.data
                if (message['accessToken'] !== undefined) {
                    let authorization = message['accessToken'].split(' ');
                    if (authorization[0] !== 'Bearer') {
                        return
                    }
                    jwt.verify(authorization[1], jwtSecret, function (err, decoded) {
                        if (err) connection.close()
                        var current_time = new Date().getTime() / 1000;
                        if (current_time > decoded.exp) {
                            connection.close()
                        }
                        
                        userId = decoded['userId']
                        clients[userId] = connection

                        ChatController.getChats(userId)
                            .then((result) => {
                                let send = JSON.stringify({
                                    type: "getChats",
                                    data: result
                                })
                                connection.sendUTF(send)
                            })
                            .catch(err => {
                                sendError(connection, err)
                            })
                    })
                }
            }
        }
    });

    function sendError(connection, err) {
        let send = JSON.stringify({
            type: "Error",
            data: err
        })
        connection.sendUTF(send)
    }

    connection.on('close', function (connection) {
        delete clients[userId]
    });
});