
// Load the Shift model
var Shift = require('../models/shiftModel');
var Template = require('../models/templateModel');
var Cancelled = require('../models/cancelledModel');
var email = require('./email');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;

// Get options from config file
var config = require('../config');

// Check if shifts have been created for the current week
exports.checkShifts = function (req, res, next) {
  var query = getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {return console.log(err0);}
    // If the week isn't cancelled, create the shifts
    if (!results0) {
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
                Shift.create({date: query.date, index: results3[i].index, time: results3[i].time, nVol: (j-k), nExec: k, newUsers: results3[i].newUsers}, function (err4, results4) {
                  if (err4) {return console.log(err4);}
                });
              }
              console.log("Creating new shifts for this Friday");
            });
          });
        }
      });
      return next();
    } else {
      // If the week is cancelled, just continue
      return next();
    }
  });
};

exports.getShifts = function (req, res, next) {
  // http://mongoosejs.com/docs/populate.html
  var query = getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {return console.log(err0);}
    if (!results0) {
      Shift.find(query).populate({path: 'Vol', select: '_id firstName lastNameInitial profilePicture'}).populate({path: 'Exec', select: '_id firstName lastNameInitial profilePicture'}).exec(function (err, results) {
        if (err) {return console.log(err)}
        res.json(results);
      });
    } else {
      var cancelled = {"cancelled": true};
      res.json(cancelled);
    }
  });
};

exports.getDetails = function (req, res, next) {
  // http://mongoosejs.com/docs/populate.html
  var query = getFriday(moment());
  var shifts = Shift.find(query).populate({path: 'Vol', select: '_id firstName lastName email'}).populate({path: 'Exec', select: '_id firstName lastName email'}).exec(function (err, results) {
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
    var switching = false; if (result != null) {switching = true;}
    // Check that there actually is a spot available
    Shift.findOne({"_id": ObjectID(shiftID)}, function (err0, result0) {
      var nVolNow = result0.Vol.length;
      if (nVolNow < result0.nVol) {
        var uQuery = getFriday(rightNow); // Ensure shift is for this week
        uQuery["_id"] = ObjectID(shiftID);
        Shift.update(uQuery, {$push:{"Vol":req.user._id}}, function (err1, results1) {
          if (err1) {return console.log(err1)};
          if (results1 != null) {
            if (switching === true) {
              email.switching(req.user._id, result, uQuery, config.opt.email);
            } else {
              email.newShift(req.user._id, uQuery, config.opt.email);
            }
          }
        });
      } else {
        console.log("No more volunteering spots left");
      }
    });
  });
  return next();
};


exports.volunteerExec = function (req, res, next) {
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
    // Check that there actually is a spot available
    Shift.findOne({"_id": ObjectID(shiftID)}, function (err0, result0) {
      var nExecNow = result0.Exec.length;
      if (nExecNow < result0.nExec) {
        var uQuery = getFriday(rightNow); // Ensure shift is for this week
        uQuery["_id"] = ObjectID(shiftID);
        Shift.update(uQuery, {$push:{"Exec":req.user._id}}, function (err1, results1) {
          if (err1) {return console.log(err1)};
          if (results1 != null) {
              email.newExecShift(req.user._id, uQuery, config.opt.email);
          }
        });
      } else {
        console.log("No spot available left");
      }
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
      if (result != null) {
        email.cancelled(req.user._id, result, config.opt.email);
      }
    });
  return next();
};

exports.deleteAnyShift= function (req, res, next) {
  var shiftID = req.body.shiftID;
  var volID = req.body.volID;
  // Quit if shifts aren't open
  if (!shouldWrite()) {
    console.log("shouldWrite was false (exiting)");
    return next;
  }
  // Just quit if the ObjectIDs aren't valid
  if (!mongoose.Types.ObjectId.isValid(shiftID)) {
    console.log("shiftID was invalid");
    return next;
  }
  if (!mongoose.Types.ObjectId.isValid(volID)) {
    console.log("volID was invalid");
    return next;
  }
  var rightNow = moment();
  var query = getFriday(rightNow);
  query["_id"] = shiftID;
  query.Vol = [];
  query.Vol[0] = volID;
  // Check if the volunteer already has a shift this week (if yes, cancel it)
  Shift.findOneAndUpdate(query, {$pull:{"Vol":volID}}, function (err, result) {
      if (err) {return console.log(err);}
      if (result != null) {
        email.cancelled(volID, result, config.opt.email);
      }
      if (result === null) {
		delete query.Vol;
		query.Exec = [];
		query.Exec[0] = volID;
        Shift.findOneAndUpdate(query, {$pull:{"Exec":volID}}, function (err, result) {
            if (err) {return console.log(err);}
            if (result != null) {
              email.cancelled(volID, result, config.opt.email);
            }
          });
      }
    });
  return next();
};

exports.getCancelled = function (req,res,next) {
  var today = moment().startOf('day').toDate();
  Cancelled.find({date: {$gte: today}}, function (err, data) {
    if (err) {return console.log(err);}
    res.json(data);
  });
};

exports.cancelWeek = function (req, res, next) {
  console.log(req.body);
  var date = moment(req.body.week, 'YYYY-MM-DD', true);
  if (date.isValid() !== true || date.day() != 5) {return console.log("Date was invalid");}
  // If the week is already cancelled, don't create a duplicate entry
  Cancelled.findOneAndUpdate({date: date.startOf('day').toDate()}, {date: date.startOf('day').toDate()}, {upsert:true}, function (err, result) {
    if (err) {return console.log(err);}
    console.log(result);
    res.json(result);
  });
};

exports.unCancelWeek = function (req, res, next) { 
  var weekID = req.body.weekID;
  console.log(weekID);
  // Just quit if the ObjectID isn't valid
  if (!mongoose.Types.ObjectId.isValid(weekID)) {
    console.log("weekID was invalid");
    return next;
  }
  Cancelled.remove({_id: weekID}, function (err, result) {
    if (err) {return console.log(err);}
    res.json(result);
  });
};


var getFriday = function (now) {
  if (now.day() < 5 && now.day() > 0) {
    query = {"date" : now.day(5).startOf('day').toDate()};
  } else if (now.day() === 5) {
    query = {"date" : now.startOf('day').toDate()};
  } else if (now.day() === 6) {
    query = {"date" : now.day(5).startOf('day').toDate()};
  } else if (now.day() === 0) {
    query = {"date" : now.day(-2).startOf('day').toDate()};
  } else {
    console.log("Could not interpret day of week in checkShifts. Had now.day() = ", now.day());
    return;
  }
	return query;
};
module.exports.getFriday = getFriday;

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
