
var Template = require('../models/templateModel');
var email = require('./email');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var Entities = require('html-entities').Html5Entities;
var entities = new Entities();

// Get options from config file
var config = require('../config');

// Return the current template
exports.getTemplate = function (req, res, next) {
  Template.findOne({}, null, {sort: {version: -1}}, function (err0, results0) {
    if (err0) {return console.log(err0);}
    if (!results0) {return console.log("No templates were found. Please create a template first");}
    Template.find({version: results0.version}, null, {sort: {index: 1}}, function (err1, results1) {
      res.json(results1);
    });
  });
};

// Set a new template
exports.newTemplate = function (req, res, next) {
  Template.findOne({}, null, {sort: {version: -1}}, function (err0, results0) {
    var i, index,utime, nSpots, nExec, newUsers, version, eachTemplate;
    if (typeof req.body.d === 'undefined' || req.body.d.length === 0) {return console.log("Template was undefined or had zero length. req.body: ", req.body);}
    for (i = 0; i < req.body.d.length; i++) {
      index = i;
      if (!results0) {version = 0;} else {version = results0.version + 1;}
      if (typeof req.body.d[i].time === 'string') {time = entities.encode(req.body.d[i].time.trim()).replace("&lt;br&gt;", "<br>").replace("&lt;br/&gt;", "<br/>").replace("&lt;br /&gt;", "<br />");} else {console.log("time was not a string");continue;}
      if (!isNaN(parseInt(req.body.d[i].nSpots, 10))) {nSpots = parseInt(req.body.d[i].nSpots, 10)} else {console.log("nSpots was not a number");continue;}
      if (!isNaN(parseInt(req.body.d[i].nExec, 10))) {nExec= parseInt(req.body.d[i].nExec, 10)} else {console.log("nExec was not a number");continue;}
      if (req.body.d[i].newUsers === 'true') {newUsers = true} else if (req.body.d[i].newUsers === 'false') {newUsers = false}  else {console.log("newUsers was not a boolean");continue;}

      eachTemplate = new Template({index: index, time: time, nSpots: nSpots, nExec: nExec, newUsers: newUsers, version: version, author: req.user._id});
      eachTemplate.save(function (err1, results1) {
        if (err1) {return console.log(err1);}
        if (( results1.index + 1 ) === req.body.d.length) {email.newTemplate(config.opt.email);}
      });
    }
    res.json(req.body);
  });
};
