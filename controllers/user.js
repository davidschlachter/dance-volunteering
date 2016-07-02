
// Load the Shift model
var User = require('../models/userModel');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

// Get the current user
exports.getUser = function (req, res, next) {
  User.findOne({_id : req.user._id}, function (err, result) {
    if (err) {return console.log(err);}
    res.json(result);
  });
};

// Get a list of admins
exports.getAdmins = function (req, res, next) {
  User.find({isAdmin : true}).select('_id firstName lastName email').exec(function (err, result) {
    if (err) {return console.log(err);}
    res.json(result);
  });
};

// Modify email preferences
exports.emailPrefs = function (req, res, next) {
  var i, sendChangedShift, sendDeletedShift, sendNewShift, sendReminder, sendThanks, sendVolunteeringCall;
  
  console.log("The req.body is:", req.body);
  
  // sendChangedShift
  if (req.body.hasOwnProperty('sendChangedShift') && typeof req.body.sendChangedShift === "string") {
    if (req.body.sendChangedShift === "on") {
      sendChangedShift = true;
    }
  } else {
    sendChangedShift = false;
  }
  
  // sendDeletedShift
  if (req.body.hasOwnProperty('sendDeletedShift') && typeof req.body.sendDeletedShift === "string") {
    if (req.body.sendDeletedShift === "on") {
      sendDeletedShift = true;
    }
  } else {
    sendDeletedShift = false;
  }
  
  // sendNewShift
  if (req.body.hasOwnProperty('sendNewShift') && typeof req.body.sendNewShift === "string") {
    if (req.body.sendNewShift === "on") {
      sendNewShift = true;
    }
  } else {
    sendNewShift = false;
  }
  
  // sendReminder
  if (req.body.hasOwnProperty('sendReminder') && typeof req.body.sendReminder === "string") {
    if (req.body.sendReminder === "on") {
      sendReminder = true;
    }
  } else {
    sendReminder = false;
  }
  
  // sendThanks
  if (req.body.hasOwnProperty('sendThanks') && typeof req.body.sendThanks === "string") {
    if (req.body.sendThanks === "on") {
      sendThanks = true;
    }
  } else {
    sendThanks = false;
  }
  
  // sendVolunteeringCall
  if (req.body.hasOwnProperty('sendVolunteeringCall') && typeof req.body.sendVolunteeringCall === "string") {
    if (req.body.sendVolunteeringCall === "on") {
      sendVolunteeringCall = true;
    }
  } else {
    sendVolunteeringCall = false;
  }
  
  // For admins
  // sendSchedule
  if (req.body.hasOwnProperty('sendSchedule') && typeof req.body.sendSchedule === "string") {
    if (req.body.sendSchedule === "on") {
      sendSchedule = true;
    }
  } else {
    sendSchedule = false;
  }
  
  // sendDetails
  if (req.body.hasOwnProperty('sendDetails') && typeof req.body.sendDetails === "string") {
    if (req.body.sendDetails === "on") {
      sendDetails = true;
    }
  } else {
    sendDetails = false;
  }

  console.log("We'll try to update userid", req.user._id);
  
  User.findOneAndUpdate({_id : req.user._id}, {$set:{
    sendNewShift: sendNewShift,
    sendChangedShift: sendChangedShift,
    sendDeletedShift: sendDeletedShift,
    sendReminder: sendReminder,
    sendThanks: sendThanks,
    sendVolunteeringCall: sendVolunteeringCall,
    sendSchedule: sendSchedule,
    sendDetails: sendDetails
  }}, function (err, result) {
    if (err) {return console.log(err);}
    console.log("Updated email preferences:", result);
  });
  
  return next();
};
