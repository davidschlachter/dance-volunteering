var TeachingWeek = require('../models/teachingWeekModel');
var email = require('./email');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var Entities = require('html-entities').Html5Entities;
var entities = new Entities();

// Get options from config file
var config = require('../config');

// Return the current teachingWeeks
exports.getTeachingWeeks = function (req, res, next) {
  var rightNow = new Date();

  TeachingWeek.find({
    date: {
      $gt: rightNow
    }
  }, null, {
    sort: {
      version: -1
    }
  }).populate({
    path: 'intermediateTeachers',
    select: '_id firstName lastName profilePicture'
  }).populate({
    path: 'beginnerTeachers',
    select: '_id firstName lastName profilePicture'
  }).exec(function (err, teachingWeeks) {
    if (err) {
      return console.log(err);
    }
    if (!teachingWeeks) {
      return console.log("No teachingWeeks were found. Please create a teachingWeek first");
    } else {
      res.json(teachingWeeks);
    }
  });
};

exports.newTeachingWeek = function (req, res, next) {
  var i;

  var date = moment(req.body.date, null, true);
  if (date.isValid() !== true || date.day() != 5) {
    return console.log("Date was invalid");
  }

  var intermediateTeachers = req.body.intermediateTeachers;
  if (intermediateTeachers.constructor === Array) {
    for (i = 0; i < intermediateTeachers.length; i++) {
      if (!mongoose.Types.ObjectId.isValid(intermediateTeachers[i])) {
        return console.log("Invalid userid in intermediateTeachers");
      }
    }
  } else {
    return console.log("intermediateTeachers was not an array");
  }

  var beginnerTeachers = req.body.beginnerTeachers;
  if (beginnerTeachers.constructor === Array) {
    for (i = 0; i < beginnerTeachers.length; i++) {
      if (!mongoose.Types.ObjectId.isValid(beginnerTeachers[i])) {
        return console.log("Invalid userid in beginnerTeachers");
      }
    }
  } else {
    return console.log("beginnerTeachers was not an array");
  }

  if (typeof req.body.intermediateTopic === 'string') {
    var intermediateTopic = entities.encode(req.body.intermediateTopic.trim());
  } else {
    return console.log("intermediateTopic was not a string");
  }

  theTeachingWeek = new TeachingWeek({
    date: date.startOf('day').toDate(),
    intermediateTeachers: intermediateTeachers,
    intermediateTopic: intermediateTopic,
    beginnerTeachers: beginnerTeachers
  });

  theTeachingWeek.save(function (err, result) {
    if (err) {
      return console.log(err);
    }
    console.log(result);
  });

};