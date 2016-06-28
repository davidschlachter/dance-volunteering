
// Load the Shift model
var Shift = require('../models/shiftModel');
var Template = require('../models/templateModel');
var moment = require('moment');
var entities = require('entities');

// e.g. entities.encodeHTML(string);

// Check if shifts have been created for the current week
exports.checkShifts = function (req,res) {
  var now = moment();
  var rfc822 = "'ddd, DD MMM YYYY HH:mm:ss ZZ";
  var query;
  if (now.day() < 5 && now.day() > 0) {
    query = {"date" : now.day(5).format(rfc822)};
  } else if (now.day() === 5) {
    query = {"date" : now.format(rfc822)};
  } else if (now.day() === 6 || now.day() === 0) {
    query = {"date" : now.day(-2).format(rfc822)};
  } else {
    console.log("Could not interpret day of week in checkShifts. Had now.day() = ", now.day());
    return;
  }
  Shift.find({query}, function (err1, results1) {
    if (err1) {console.log(err1)}
    // If there are no shifts for this week, create them
    if (!results1.length) {
      Template.findOne({}, null, {sort: {version: -1}}, function(err2, results2) {
        if (err2) {console.log(err2)}
        Template.find({version: results2.version}, function(err3, results3) {
          var i, j, k;
          for (i = 0, i < results3.length; i++) {
            j = results3[i].nSpots; k = results3[i].nExec;
            Shift.create({date: query.date, index: results3[i].index, time: results3[i].time, Vol: Array(j-k), Exec: Array(k)}, function (err4, results4) {
              if (err4) {console.log(err4)}
            });
          }
        });
      });
    }
  });
};
