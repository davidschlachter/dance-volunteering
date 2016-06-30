
// Load the Shift model
var Shift = require('../models/shiftModel');
var Template = require('../models/templateModel');
var moment = require('moment');

// Check if shifts have been created for the current week
exports.checkShifts = function (req, res, next) {
  var query = getFriday(moment());
  Shift.find(query, function (err1, results1) {
    if (err1) {console.log(err1)}
    // If there are no shifts for this week, create them
    if (!results1.length) {
      Template.findOne({}, null, {sort: {version: -1}}, function(err2, results2) {
        if (err2) {console.log(err2);}
        if (!results2) {console.log("No templates were found. Please create a template first");}
        Template.find({version: results2.version}, function(err3, results3) {
          var i, j, k;
          var l, m;
          for (i = 0; i < results3.length; i++) {
            j = results3[i].nSpots; k = results3[i].nExec;
            Shift.create({date: query.date, index: results3[i].index, time: results3[i].time, nVol: (j-k), nExec: k}, function (err4, results4) {
              if (err4) {console.log(err4);}
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
    if (err) {console.log(err)}
    res.json(results);
  });
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
}