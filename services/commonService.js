const mongoose = require('mongoose');
const db = mongoose.connection;
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const config = require('../config.json');

let commonService = {};

const BCRYPT_SALT_ROUNDS = 12;

commonService.init = (req, res) => {
    if(req.method != "OPTIONS") {
        let action = req.body.action;
        delete req.body.action;
        if(action == "login") {
            commonService.login(req, res);
        } else if(action == "verifyEmail") {
            commonService.verifyEmail(req, res);
        } else if(action == "register") {
            commonService.register(req, res);
        } else {
            let responseObj = {};
            responseObj.status = "Error";
            responseObj.message = "Invalid Action";
            res.send(responseObj);
        }
    } else {
        res.send("TRUE")
    }
}

commonService.login = (req, res) => {
    let responseObj = {};
    db.collection('users').findOne({ emailId: req.body.data.emailId }, (err, result) => {
        if(!err) {
            if(result) {
                bcrypt.compare(req.body.data.password, result.password).then((match) => {
                    if(match == true) {
                        var token = jwt.sign({ emailId: result.emailId, type: 'login' }, config.jwt_secret
                        // , { expiresIn: '1h'}
                        );
                        delete result.password;
                        let resultObj = result;
                        resultObj.token = token;
                        responseObj.status = "Success";
                        responseObj.data = resultObj;
                        res.send(responseObj);
                    } else {
                        responseObj.status = "Error";
                        responseObj.message = "Invalid Password";
                        res.send(responseObj);
                    }
                })
                .catch((err) => {
                    responseObj.status = "Error";
                    responseObj.message = "Invalid Password";
                    res.send(responseObj);
                })
            } else {
                responseObj.status = "Error";
                responseObj.message = "Invalid Email";
                res.send(responseObj);
            }
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    })
}

commonService.verifyEmail = (req, res) => {
    let responseObj = {};
    db.collection('users').findOne({ emailId: { $regex: req.body.data, $options: 'i' } }, (err, result) => {
        if(!err) {
            if(result) {
                responseObj.status = "Error";
                responseObj.message = "Email already exists";
                res.send(responseObj);
            } else {
                responseObj.status = "Success";
                responseObj.data = null;
                res.send(responseObj);
            }
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

commonService.register = (req, res) => {
    let responseObj = {};
    db.collection('users').findOne({ emailId: req.body.data.emailId }, (err, result) => {
        if(!err) {
            if(result) {
                responseObj.status = "Success";
                responseObj.message = "This email is already registered with us. Please login";
                res.send(responseObj);
            } else {
                bcrypt.hash(req.body.data.password, BCRYPT_SALT_ROUNDS).then((hashedPassword) => {
                    req.body.data.password = hashedPassword;
                    db.collection('users').insert(req.body.data, (insertErr, insertResult) => {
                        if (!insertErr) {
                            var token = jwt.sign({
                                    emailId: insertResult.ops[0].emailId
                                }, config.jwt_secret
                            );
                            delete insertResult.ops[0].password;
                            let resultObj = insertResult.ops[0];
                            resultObj.token = token;
                            responseObj.status = "Success";
                            responseObj.data = resultObj;
                            res.send(responseObj);
                        } else {
                            responseObj.status = "Error";
                            responseObj.message = insertErr;
                            res.send(responseObj);
                        }
                    });
                });
            }
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

module.exports = commonService;