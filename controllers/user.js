// Load the Shift model
var User = require('../models/userModel');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var email = require('./email');
var Shift = require('../models/shiftModel');
var config = require('../config');
var crypto = require('crypto');


// Get the current user
//exports.getUser = function (req, res, next) {
//  User.findOne({_id : req.user._id}, function (err, result) {
//    if (err) {return console.log(err);}
//    res.json(result);
//  });
//};

// Get a list of admins
exports.getAdmins = function (req, res, next) {
  User.find({
    isAdmin: true
  }).select('_id firstName lastName email').exec(function (err, result) {
    if (err) {
      return console.log(err);
    }
    res.json(result);
  });
};

// Find users to add them as admins
exports.searchAdmins = function (req, res, next) {
  var adminQuery = req.query.adminInput.replace(/[^a-zA-Z0-9]+/g, "");
  if (typeof adminQuery === "string" && adminQuery.length > 3) {
    var adminInput = new RegExp(adminQuery, "i");
    User.find({
      userName: adminInput,
      isAdmin: false
    }).select('_id firstName lastName email profilePicture').exec(function (err, result) {
      if (err) {
        return console.log(err);
      }
      res.json(result);
    });
  }
};

// Add a user as an admin
exports.makeAdmin = function (req, res, next) {
  var userid = req.body.userid;
  // Just quit if the ObjectID isn't valid
  if (!mongoose.Types.ObjectId.isValid(userid)) {
    console.log("shiftID was invalid");
    return next();
  }
  User.findOneAndUpdate({
    _id: userid
  }, {
    $set: {
      isAdmin: true,
      isNewUser: false
    }
  }, function (err, result) {
    if (err) {
      return console.log(err);
    }
    if (result) {
      email.newAdmin(result, config.opt.email);
      console.log("New admin: " + result.userName);
    }
    res.json(result);
  });
}

// Remove a user as an admin
exports.removeAdmin = function (req, res, next) {
  var userid = req.body.userid;
  // Just quit if the ObjectID isn't valid
  if (!mongoose.Types.ObjectId.isValid(userid)) {
    console.log("userid was invalid");
    return next();
  }
  // Don't permit an admin to remove themselves!
  if (userid.toString() === req.user._id.toString()) {
    console.log("admin tried to delete themselves");
    return next();
  }
  User.findOneAndUpdate({
    _id: userid
  }, {
    $set: {
      isAdmin: false
    }
  }, function (err, result) {
    if (err) {
      return console.log(err);
    }
    if (result) {
      email.removedAdmin(result, config.opt.email);
      console.log("Removed admin: " + result.userName);
    }
    res.json(result);
  });
}

// Modify email preferences
exports.emailPrefs = function (req, res, next) {
  var i, sendChangedShift, sendDeletedShift, sendNewShift, sendReminder, sendThanks, sendVolunteeringCall, sendLastCall, sendSchedule;

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

  // sendLastCall
  if (req.body.hasOwnProperty('sendLastCall') && typeof req.body.sendLastCall === "string") {
    if (req.body.sendLastCall === "on") {
      sendLastCall = true;
    }
  } else {
    sendLastCall = false;
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

  User.findOneAndUpdate({
    _id: req.user._id
  }, {
    $set: {
      sendNewShift: sendNewShift,
      sendChangedShift: sendChangedShift,
      sendDeletedShift: sendDeletedShift,
      sendReminder: sendReminder,
      sendThanks: sendThanks,
      sendVolunteeringCall: sendVolunteeringCall,
      sendLastCall: sendLastCall,
      sendSchedule: sendSchedule
    }
  }, function (err, result) {
    if (err) {
      return console.log(err);
    }
    console.log("Updated email preferences for " + result.userName);
    return next();
  });

};

// Update email preferences when clicking an 'unsubscribe' link
exports.unsubscribe = function (req, res, next) {
  if (!req.query) {
    return res.redirect(config.opt.base_url + '/#emailPrefs');
  }
  var validParams = ['sendNewShift',
    'sendChangedShift',
    'sendDeletedShift',
    'sendReminder',
    'sendThanks',
    'sendVolunteeringCall',
    'sendLastCall',
    'sendSchedule'
  ];
  if (req.query.hmac && typeof req.query.hmac === 'string') {
    var hmac = req.query.hmac;
  } else {
    return res.redirect(config.opt.base_url + '/#emailPrefs');
  }
  if (req.query.id && typeof req.query.id === 'string') {
    var id = req.query.id;
  } else {
    return res.redirect(config.opt.base_url + '/#emailPrefs');
  }
  if (req.query.param && typeof req.query.param === 'string' && validParams.indexOf(req.query.param) > -1) {
    var param = req.query.param;
  } else {
    return res.redirect(config.opt.base_url + '/#emailPrefs');
  }

  if (crypto.createHmac('sha1', config.opt.linkSecret).update(id).digest('hex') === hmac) {
    var update = {};
    update[req.query.param] = false;

    User.findOneAndUpdate({
      _id: id
    }, {
      $set: update
    }, function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log("Unsubscribed " + result.userName + " from " + req.query.param.replace('send', ''));
      return res.render('unsubscribe', {
        title: 'Unsubscribed',
        unsubscribeText: "Successfully unsubscribed " + result.email
      });
    });
  } else {
    console.log("Link was NOT valid. req.query was:", req.query);
    return res.redirect(config.opt.base_url + '/#emailPrefs');
  }

};

// Update the isNewUser flag for users
exports.updateNewUsers = function () {
  User.find({
    isNewUser: true,
    isAdmin: false
  }).exec(function (err0, users) {
    if (err0) {
      return console.log(err0);
    }
    var i, query = {};
    for (i = 0; i < users.length; i++) {
      query.Vol = [];
      query.Vol[0] = users[i]._id;
      console.log("Starting the loop with query:", query);
      Shift.findOne(query, function (err1, shift) {
        if (err1) {
          return console.log(err1);
        }
        if (shift != null && shift.Vol) {
          // Note: accessing shift.Vol[0] is dangerous because if the array.length is > 0, we could miss a user here
          User.findOneAndUpdate({
            _id: shift.Vol[0]
          }, {
            $set: {
              isNewUser: false
            }
          }, function (err2, result) {
            if (err2) {
              return console.log(err2);
            }
            console.log("User", result.userName, "is no longer a NewUser.");
          });
        } else {
          console.log("User is still a NewUser.");
        }
      });
    }
  });
  // Now for the Exec version!
  User.update({
    isNewUser: true,
    isAdmin: true
  }, {
    $set: {
      isNewUser: false
    }
  }, {
    multi: true
  }, function (err, admins) {
    if (err) {
      return console.log(err);
    }
    var i;
    console.log("Exec function returned:", admins);
  });
};