// Load the Shift model
var User = require('../models/userModel');
var mongoose = require('mongoose');
var email = require('./email');
var Shift = require('../models/shiftModel');
var shift = require('../controllers/shift');
var moment = require('moment');
var config = require('../config');
var crypto = require('crypto');

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
  var i, sendChangedShift, sendDeletedShift, sendNewShift, sendReminder, sendVolunteeringCall, sendLastCall, sendSchedule;

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
  var query = shift.getFriday(moment());
  var shifts = Shift.find(query, null, {
    sort: {
      index: 1
    }
  }).populate({
    path: 'Vol',
    select: '_id firstName lastNameInitial email isNewUser'
  }).exec(function (err, results) {
    if (err) {
      return console.log(err);
    }
    if (results.length) {
      var i, j;
      for (i = 0; i < results.length; i++) {
        if (results[i].Vol.length > 0) {
          for (j = 0; j < results[i].Vol.length; j++) {
            if (results[i].Vol[j].isNewUser === true) {
              User.findOneAndUpdate({
                _id: results[i].Vol[j]._id
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
            }
          }
        }
      }
    }
  });
};


// List frequent volunteers
exports.getFrequent = function (req, res, next) {

  var i, j;

  Shift.find({
    date: {
      $gte: new Date(new Date().setFullYear(new Date().getFullYear() + -1))
    }
  }).populate({
    path: 'Vol',
    select: '_id userName email'
  }).exec(function (err, shiftResults) {
    if (err) {
      return console.log(err);
    }
    if (!shiftResults.length) {
      return console.log("No shifts found in getFrequent");
    }

    var volunteers = [];

    for (j = 0; j < shiftResults.length; j++) {
      for (i = 0; i < shiftResults[j].Vol.length; i++) {
        volunteers.push(shiftResults[j].Vol[i].userName + "|" + shiftResults[j].Vol[i].email); // Separate name and email with a pipe
      }
    }

    var volCount = compressArray(volunteers);

    volCount.sort(function (a, b) {
      return b.count - a.count;
    });

    // Return the top 20 entries
    var volCountCut = volCount.slice(0, 20)
    res.json(volCountCut);
  });

};


// Don't send volunteering call or lastCall to users who haven't
// volunteered in the previous year
exports.tidyEmailList = function () {
  var i, j;

  Shift.find({
    date: {
      $gte: new Date(new Date().setFullYear(new Date().getFullYear() + -1))
    }
  }).populate({
    path: 'Vol',
    select: '_id'
  }).exec(function (err, shiftResults) {
    if (err) { return console.log(err); }
    if (!shiftResults.length) { return console.log("No shifts found in tidyEmailList"); }

    var volunteers = [];

    for (j = 0; j < shiftResults.length; j++) {
      for (i = 0; i < shiftResults[j].Vol.length; i++) {
        volunteers.push(shiftResults[j].Vol[i]._id);
      }
    }

    var uniqVolunteers = uniq(volunteers);

    // Iterate over all users (who have volunteered at least once
    // and are not admins, check if they have volunteered in
    // the past year
    User.find({
      isNewUser: false,
      isAdmin: false,
      sendVolunteeringCall: true
    }).select('_id userName sendVolunteeringCall sendLastCall').exec(function (err, result) {
      if (err) { return console.log(err); }
      var hasVolunteered = false;
      for (i = 0; i < result.length; i++) { // For all users who are not new users
        hasVolunteered = false;
        for (j = 0; j < uniqVolunteers.length; j++) { // For those who have volunteered
          if (result[i]._id.toString() === uniqVolunteers[j].toString()) {
            hasVolunteered = true;
          }
        }
        if (hasVolunteered === false) {
          console.log("Removing user from the volunteering call: " + result[i].userName)
          console.log("  Previous email preferences: sendVolunteeringCall " + result[i].sendVolunteeringCall + " sendLastCall: " + result[i].sendLastCall)
          User.findOneAndUpdate({
            _id: result[i]._id
          }, {
            $set: {
              sendVolunteeringCall: false, sendLastCall: false
            }
          }, function (err, result) {
            if (err) { return console.log(err); }
          });
        } // done modifying email preferences
      } // on to the next user
    });

  });

};


// Count the unique items in an array
// via https://gist.github.com/raecoo/4230308
function compressArray(original) {

  var compressed = [];
  // make a copy of the input array
  var copy = original.slice(0);

  // first loop goes over every element
  for (var i = 0; i < original.length; i++) {

    var myCount = 0;
    // loop over every element in the copy and see if it's the same
    for (var w = 0; w < copy.length; w++) {
      if (original[i] == copy[w]) {
        // increase amount of times duplicate is found
        myCount++;
        // sets item to undefined
        delete copy[w];
      }
    }

    if (myCount > 0) {
      var a = new Object();
      a.value = original[i];
      a.count = myCount;
      compressed.push(a);
    }
  }

  return compressed;
};

// Remove duplicates from array
// https://stackoverflow.com/a/9229821/3380815
function uniq(a) {
  return Array.from(new Set(a));
}