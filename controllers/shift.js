
// Load the Shift model
var Shift = require('../models/shiftModel');
var Template = require('../models/templateModel');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

// Get options from config file
var config = require('../config');

// Check if shifts have been created for the current week
exports.checkShifts = function (req, res, next) {
  var query = getFriday(moment());
  Shift.find(query, function (err1, results1) {
    if (err1) {return console.log(err1);}
    // If there are no shifts for this week, create them
    if (!results1.length) {
      Template.findOne({}, null, {sort: {version: -1}}, function (err2, results2) {
        if (err2) {return console.log(err2);}
        if (!results2) {return console.log("No templates were found. Please create a template first");}
        Template.find({version: results2.version}, function (err3, results3) {
          var i, j, k, l, m;
          for (i = 0; i < results3.length; i++) {
            j = results3[i].nSpots; k = results3[i].nExec;
            Shift.create({date: query.date, index: results3[i].index, time: results3[i].time, nVol: (j-k), nExec: k}, function (err4, results4) {
              if (err4) {return console.log(err4);}
            });
          }
          console.log("Creating new shifts for this Friday");
        });
      });
    }
  });
  return next();
};

exports.getShifts = function (req, res, next) {
  // http://mongoosejs.com/docs/populate.html
  var query = getFriday(moment());
  var shifts = Shift.find(query).populate({path: 'Vol', select: '_id firstName lastNameInitial profilePicture'}).populate({path: 'Exec', select: '_id firstName lastNameInitial profilePicture'}).exec(function (err, results) {
    if (err) {return console.log(err)}
    res.json(results);
  });
};

exports.volunteer = function (req, res, next) {
  var shiftID = req.body.shiftID;
  // Just quit if the ObjectID isn't valid
  if (!mongoose.Types.ObjectId.isValid(shiftID)) {
    console.log("shiftID was invalid");
    return next;
  }
  // Quit if shifts aren't open
  if (!shouldWrite()) {
    console.log("shouldWrite was false (exiting)");
    return next;
  }
  var rightNow = moment();
  var query = getFriday(rightNow);
  query.Vol = [];
  query.Vol[0] = req.user._id;
  // Check if the volunteer already has a shift this week (if yes, cancel it)
  Shift.findOneAndUpdate(query, {$pull:{"Vol":req.user._id}}, function (err, result) {
    if (err) {return console.log(err);}
    // Check that there actually is a spot available
    Shift.findOne({"_id": ObjectID(shiftID)}, function (err0, result0) {
      var nVolNow = result0.Vol.length;
      if (nVolNow < result0.nVol) {
        var uQuery = getFriday(rightNow); // Ensure shift is for this week
        uQuery["_id"] = ObjectID(shiftID);
        Shift.update(uQuery, {$push:{"Vol":req.user._id}}, function (err1, results1) {
          if (err1) {return console.log(err1)};
          console.log("Added shift", results1);
        });
      } else {
        console.log("No more volunteering spots left");
      }
    });
  });
  return next();
};


exports.deleteMyShift= function (req, res, next) {
  // Quit if shifts aren't open
  if (!shouldWrite()) {
    console.log("shouldWrite was false (exiting)");
    return next;
  }
  var rightNow = moment();
  var query = getFriday(rightNow);
  query.Vol = [];
  query.Vol[0] = req.user._id;
  // Check if the volunteer already has a shift this week (if yes, cancel it)
  Shift.findOneAndUpdate(query, {$pull:{"Vol":req.user._id}}, function (err, result) {
    if (err) {return console.log(err);}
     console.log("Deleted shift");
    });
  return next();
};


function getFriday(now) {
  if (now.day() < 5 && now.day() > 0) {
    query = {"date" : now.day(5).startOf('day').toDate()};
  } else if (now.day() === 5) {
    query = {"date" : now.startOf('day').toDate()};
  } else if (now.day() === 6 || now.day() === 0) {
    query = {"date" : now.day(-2).startOf('day').toDate()};
  } else {
    console.log("Could not interpret day of week in checkShifts. Had now.day() = ", now.day());
    return;
  }
	return query;
};

function shouldWrite() {
  var now = moment();
  if (now.day() < 5 && now.day() > 0) {
    return true;
  } else if (now.day() === 5 && now.hour() < 17) {
    return true;
  } else if (now.day() === 5 && now.hour() >= 17) {
    return false;
  } else if (now.day() === 6 || now.day() === 0) {
    return false;
  } else {
    console.log("Could not interpret time in shouldWrite. Had now.day() = ", now.day(), "and now.hour() = ", now.hour());
    return false;
  }
};