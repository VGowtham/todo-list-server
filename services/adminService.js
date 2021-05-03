const mongoose = require('mongoose');
const db = mongoose.connection;
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const config = require('../config.json');

let adminService = {};

adminService.init = (req, res) => {
    if(req.method != "OPTIONS") {
        let action = req.body.action;
        delete req.body.action;
        if(action == "getUsers") {
            adminService.getUsers(req, res);
        } else if(action == "deleteUser") {
            adminService.deleteUser(req, res);
        } else if(action == "addUsers") {
            adminService.addUsers(req, res);
        } else if(action == "getUserById") {
            adminService.getUserById(req, res);
        } else if(action == "updateUser") {
            adminService.updateUser(req, res);
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

adminService.getUsers = (req, res) => {
    let responseObj = {};
    let findQuery = {
        role: "User"
     };
    if(req.body.filter.username) {
        findQuery["username"] = { $regex: req.body.filter.username, $options: 'i' }
    }
    db.collection('users').find(findQuery).count().then((count, err) => {
        if(!err) {
            if(count > 0) {
                let query = db.collection('users').find(findQuery);
                if(req.body.limit) {
                    query = query.skip(req.body.offset * req.body.limit).limit(req.body.limit);
                }
                if(req.body.sort != '') {
                    let sortObj = {};
                    sortObj[req.body.sortBy] = req.body.sort;
                    query = query.sort(sortObj);
                }
                query.toArray().then((result, err) => {
                    if(!err) {
                        responseObj.status = "Success";
                        responseObj.data = result ? result: [];
                        responseObj.count = count;
                        res.send(responseObj);
                    } else {
                        responseObj.status = "Error";
                        responseObj.message = err;
                        res.send(responseObj);
                    }
                })
            } else {
                responseObj.status = "Success";
                responseObj.data = [];
                res.send(responseObj);
            }
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

adminService.addUsers = (req, res) => {
    let responseObj = {};
    db.collection('users').insertMany(req.body.data, (err, result) => {
        if(!err) {
            responseObj.status = "Success";
            responseObj.data = result;
            res.send(responseObj);
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

adminService.deleteUser = (req, res) => {
    let responseObj = {};
    db.collection('users').remove({ _id: mongoose.Types.ObjectId(req.body.id) }, (err, result) => {
        if(!err) {
            responseObj.status = "Success";
            responseObj.data = result;
            res.send(responseObj);
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

adminService.getUserById = (req, res) => {
    let responseObj = {};
    db.collection('users').findOne({ _id: mongoose.Types.ObjectId(req.body.id) }, (err, result) => {
        if(!err) {
            responseObj.status = "Success";
            responseObj.data = result;
            res.send(responseObj);
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

adminService.updateUser = (req, res) => {
    let responseObj = {};
    db.collection('users').updateOne({ _id: mongoose.Types.ObjectId(req.body.id) }, { $set : req.body.data }, (err, result) => {
        if(!err) {
                responseObj.status = "Success";
                responseObj.data = result;
                res.send(responseObj);
        } else {
            responseObj.status = "Error";
            responseObj.message = err;
            res.send(responseObj);
        }
    });
};

module.exports = adminService;