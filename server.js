const express = require('express');
const bodyParser= require('body-parser')
const app = express();
const cors = require('cors');
app.use(cors());
app.use(bodyParser.json({ extended: true }));
const adminService = require('./services/adminService')
const userService = require('./services/userService')
const commonService = require('./services/commonService')
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
const config = require('./config.json')

const option = {
    socketTimeoutMS: 30000,
    keepAlive: true,
    reconnectTries: 30000,
    useNewUrlParser: true
};
mongoose.connect('mongodb://localhost:27017/todo-list', option);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  // we're connected!
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

app.use('/admin', authenticate, (req, res) => {
    adminService.init(req, res);
});

app.use('/user', authenticate, (req, res) => {
    userService.init(req, res);
});

app.use('/common', authenticate, (req, res) => {
    commonService.init(req, res);
});

function authenticate(req, res, next) {
    let whitelist = [
        'login',
        'register'
    ];
    if(whitelist.includes(req.body.action)) {
         next();
     } else {
        if (!req.headers.jwt_token) {
            return res.send({ status: "Error", message: 'No token provided' });
        }
        jwt.verify(req.headers.jwt_token, config.jwt_secret, function(err, decoded) {
            if (err) {
                return res.send({ status: "Error", message: err.name });
            } else {
                if(Date.now() >= decoded.exp * 1000) {
                    responseObj.status = "Error";
                    responseObj.message = "Token Expired";
                    res.send(responseObj);
                } else {
                    next();
                }
            }
        });
    }
};

const server = require('http').createServer(app);

server.listen(3000, '0.0.0.0', () => {
    console.log('listening on 3000')
});