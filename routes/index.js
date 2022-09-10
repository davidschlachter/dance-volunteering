var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var Cancelled = require('../models/cancelledModel');
var moment = require('moment');
var csrf = require('csurf');

// Get options from config file
var config = require('../config');

var shift = require('../controllers/shift');
var template = require('../controllers/template');
var userController = require('../controllers/user');
var extraText = require('../controllers/extraText');
var csrfProtection = csrf({
  cookie: false
});

var cookieExpiryDate = new Date(Number(new Date()) + 31536000000);

/* GET home page. */

router.get('/', shift.checkShifts, csrfProtection, function (req, res, next) {
  // Get the shifts for this week
  var query = shift.getFriday(moment());
  var csrfToken = req.csrfToken();
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {
      return console.log(err0);
    }
    if (!results0) {
      Shift.find(query, null, {
        sort: {
          index: 1
        }
      }).populate({
        path: 'Vol',
        select: '_id firstName lastNameInitial profilePicture'
      }).populate({
        path: 'Exec',
        select: '_id firstName lastNameInitial profilePicture'
      }).exec(function (err1, shifts) {
        if (err1) {
          return console.log(err1);
        }
        // Get the user's profile as well
        // If not logged in,
        if (typeof req.user === "undefined") {
          var shiftsTextVals = shiftsText(shifts, "", csrfToken);
          console.log("User is not logged in from " + req.headers['x-forwarded-for']);
          res.render('index', {
            title: config.opt.title,
            full_url: config.opt.full_url,
            user: "",
            nonce: res.locals.nonce,
            csrfToken: csrfToken,
            shiftsText: shiftsTextVals.lines,
            friday: shiftsTextVals.friday,
            datewell: shiftsTextVals.datewell,
            delIDs: shiftsTextVals.delIDs
          });
          // If logged in,
        } else {
          var userQuery = req.user._id;
          User.findOne({
            _id: userQuery
          }, function (err1, user) {
            if (err1) {
              return console.log(err1);
            }
            var shiftsTextVals = shiftsText(shifts, user, csrfToken);
            console.log("User is " + user.userName + " from " + req.headers['x-forwarded-for'] + " using " + req.headers['user-agent']);
            res.render('index', {
              title: config.opt.title,
              full_url: config.opt.full_url,
              user: user,
              nonce: res.locals.nonce,
              csrfToken: csrfToken,
              shiftsText: shiftsTextVals.lines,
              friday: shiftsTextVals.friday,
              datewell: shiftsTextVals.datewell,
              delIDs: shiftsTextVals.delIDs
            });
          });
        }
      });
      // If the week is cancelled...
    } else {
      if (typeof req.user === "undefined") {
        console.log("User is not logged in from " + req.headers['x-forwarded-for']);
        res.render('index', {
          title: config.opt.title,
          full_url: config.opt.full_url,
          user: "",
          nonce: res.locals.nonce,
          csrfToken: csrfToken,
          delIDs: ""
        });
      } else {
        var userQuery = req.user._id;
        User.findOne({
          _id: userQuery
        }, function (err1, user) {
          if (err1) {
            return console.log(err1);
          }
          console.log("User is " + user.userName + " from " + req.headers['x-forwarded-for'] + " using " + req.headers['user-agent']);
          res.render('index', {
            title: config.opt.title,
            full_url: config.opt.full_url,
            user: user,
            nonce: res.locals.nonce,
            csrfToken: csrfToken,
            delIDs: ""
          });
        });
      }
    }
  });
});

/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('login', {
    title: config.opt.title + ' - Login'
  });
});

/* GET can't log in page */
router.get('/cant-login', function (req, res, next) {
  res.render('cant-login', {
    title: config.opt.title + ' - Can\'t log in!'
  });
});

/* GET logout */
router.get('/logout', function (req, res) {
  req.logout();
  res.redirect(config.opt.base_url + '/');
});

/* POST to volunteer for a shift */
router.post('/volunteer', checkAuth, csrfProtection, shift.volunteer, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to volunteer for an exec shift */
router.post('/volunteerExec', checkAuth, checkExec, csrfProtection, shift.volunteerExec, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to delete user's own shift */
router.post('/deleteMyShift', checkAuth, csrfProtection, shift.deleteMyShift, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to delete any shift */
router.post('/deleteAnyShift', checkAuth, checkExec, csrfProtection, shift.deleteAnyShift, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to change email preferences */
router.post('/emailPrefs', checkAuth, csrfProtection, userController.emailPrefs, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* GET to unsubscribe from an email */
router.get('/unsubscribe', userController.unsubscribe);

/* GET logins to various services */
router.get('/loginFacebook', passport.authenticate('facebook', {
  scope: ['email'],
  successRedirect: config.opt.base_url + '/',
  failureRedirect: config.opt.base_url + '/cant-login'
}));
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: config.opt.base_url + '/cant-login',
  }),
  function (req, res) {
    User.findById(req.user._id, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Facebook log-in from", req.user.userName);
        res.cookie('authMethod', "Facebook", {
          path: '/',
          expires: cookieExpiryDate
        });
        res.cookie('userName', user.firstName, {
          path: '/',
          expires: cookieExpiryDate
        });
        res.redirect(config.opt.base_url + '/');
      }
    });
  });

router.get('/loginGoogle', passport.authenticate('google', {
  scope: ['profile', 'email'],
  successRedirect: config.opt.base_url + '/',
  failureRedirect: config.opt.base_url + '/cant-login'
}));
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: config.opt.base_url + '/cant-login',
  }),
  function (req, res) {
    User.findById(req.user._id, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Google log-in from", req.user.userName);
        res.cookie('authMethod', "Google", {
          path: '/',
          expires: cookieExpiryDate
        });
        res.cookie('userName', user.firstName, {
          path: '/',
          expires: cookieExpiryDate
        });
        res.redirect(config.opt.base_url + '/');
      }
    });
  });

/* GET the shifts */
router.get('/getShifts', shift.getShifts);

/* GET volunteer details */
router.get('/getDetails', checkAuth, checkExec, shift.getDetails);

/* GET list of admins */
router.get('/getAdmins', checkAuth, checkExec, userController.getAdmins);

/* POST to add a user as an admin */
router.post('/makeAdmin', checkAuth, checkExec, csrfProtection, userController.makeAdmin);

/* POST to remove a user as an admin */
router.post('/removeAdmin', checkAuth, checkExec, csrfProtection, userController.removeAdmin);

/* POST to cancel a week */
router.post('/cancelWeek', checkAuth, checkExec, csrfProtection, shift.cancelWeek);

/* POST to uncancel a week */
router.post('/unCancelWeek', checkAuth, checkExec, csrfProtection, shift.unCancelWeek);

/* GET to get cancelled weeks */
router.get('/getCancelled', checkAuth, checkExec, shift.getCancelled);

/* GET users for admin adding */
router.get('/searchAdmins', checkAuth, checkExec, userController.searchAdmins);

/* GET the current shift template */
router.get('/getTemplate', checkAuth, checkExec, template.getTemplate);

/* POST a new set of templates */
router.post('/newTemplate', checkAuth, checkExec, csrfProtection, template.newTemplate);

/* Get extra text for printing */
router.get('/getExtraText', checkAuth, checkExec, extraText.getextraText);

/* POST to save text for printing */
router.post('/setExtraText', checkAuth, checkExec, csrfProtection, extraText.setextraText);

/* GET the list of most frequent volunteers */
router.get('/getFrequent', checkAuth, checkExec, userController.getFrequent);

/* Check if authenticated */
function checkAuth(req, res, next) {
  if (req.user) {
    next();
  } else {
    if (typeof req.body.shiftID != "undefined") {
      res.cookie('shiftID', req.body.shiftID, {
        path: '/'
      });
    }
    res.redirect(config.opt.base_url + '/login');
  }
}

/* Check if exec */
function checkExec(req, res, next) {
  User.findById(req.user._id, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect(config.opt.base_url + '/');
    } else {
      if (user.isAdmin === true) {
        return next();
      } else {
        console.log("Not exec");
        res.redirect(config.opt.base_url + '/');
      }
    }
  });
}

/* Generate the HTML for the table server-side */
function shiftsText(data, user, csrf) {
  var shouldWriteStatus = shouldWrite();

  var g, h, i, line, lines, colSpanText, userName, profilePicture, tableText, deleteButton;

  var lines = "<thead><tr><th>Time</th>";

  // Determine the number of columns
  var nCol = 0;
  for (i = 0; i < data.length; i++) {
    if (data[i].nVol + data[i].nExec > nCol) {
      nCol = data[i].nVol + data[i].nExec;
    }
  }
  lines += "<th id='volCol' colspan='" + nCol + "'>Volunteer(s)</th></tr></thead><tbody>";

  // Are shifts open?
  var areOpen = shouldWriteStatus,
    action;
  if (areOpen) {
    action = 'type="submit"';
    delAction = ''
  } else {
    action = 'disabled type="button"';
    delAction = 'disabled'
  }

  // Set up the volunteering table
  var nSpots, nVol, nExec, colSpan, newUserText;
  var delIDCounter = 0;
  var delIDs = [];
  for (i = 0; i < data.length; i++) {
    nVol = data[i].nVol;
    nExec = data[i].nExec;
    nSpots = nVol + nExec;
    colSpan = nCol - nSpots;
    line = '<tr><td>' + data[i].time + '</td>';
    for (h = 0; h < nVol; h++) {
      if (h === 0 && colSpan !== 0) {
        colSpanText = ' colspan = "' + (colSpan + 1) + '"';
      } else {
        colSpanText = "";
      }
      if (data[i].Vol[h] !== null && typeof data[i].Vol[h] === 'object') {
        userName = data[i].Vol[h].firstName + " " + data[i].Vol[h].lastNameInitial;
        profilePicture = data[i].Vol[h].profilePicture.replace("http:", "https:");
        if (typeof user === 'object' && user._id.toString() === data[i].Vol[h]._id.toString()) {
          deleteButton = '<input id="del' + delIDCounter + '" type="button" value="✘" ' + delAction + ' class="btn btn-danger btn-xs" />';
          delIDs.push(['del' + delIDCounter, "deleteMyShift()"]);
          delIDCounter = delIDCounter + 1;
        } else if (typeof user === 'object' && user.isAdmin === true) {
          deleteButton = '<span class="otherDel"><input id="del' + delIDCounter + '" type="button" value="✘" ' + delAction + ' class="btn btn-danger btn-xs" data-shift="' + data[i]._id + '" data-user="' + data[i].Vol[h]._id + '"/></span>';
          delIDs.push(['del' + delIDCounter, 'deleteAnyShift("' + data[i]._id + '", "' + data[i].Vol[h]._id + ')']);
          delIDCounter = delIDCounter + 1;
        } else {
          deleteButton = ""
        }
        tableText = '<img alt="' + userName + '" class="user" src="' + profilePicture + '" /> ' + userName + ' ' + deleteButton;
      } else {
        deleteButton = "";
        if (areOpen && typeof user === 'object' && user.isNewUser === false) {
          action = 'type="submit"';
        } else if (areOpen && typeof user === 'object' && user.isNewUser === true && data[i].newUsers === true) {
          action = 'type="submit"';
        } else if (areOpen && typeof user === 'object' && user.isNewUser === true && data[i].newUsers === false) {
          action = 'disabled type="button"';
        }
        tableText = '<form class="volForm" action="volunteer" method="post"><input type="text" name="shiftID" class="shiftID" value="' + data[i]._id + '"><input type="text" name="_csrf" value="' + csrf + '" class="csrf"><input ' + action + ' value="Volunteer" class="volButton btn btn-primary" /></form>';
      }
      line += '<td' + colSpanText + '>' + tableText + '</td>';
    }
    var execClass;
    var action2;
    if (typeof user === "object" && user.isAdmin === true && shouldWriteStatus) {
      execClass = "btn btn-primary";
      action2 = 'type="submit"';
    } else {
      execClass = "btn btn-default";
      action2 = 'disabled type="button"';
    }
    for (h = 0; h < nExec; h++) {
      if (data[i].Exec[h] !== null && typeof data[i].Exec[h] === 'object') {
        if (typeof user === 'object' && user._id.toString() === data[i].Exec[h]._id.toString()) {
          deleteButton = '<input id="del' + delIDCounter + '" type="button" value="✘" ' + delAction + ' class="btn btn-danger btn-xs" data-shift="' + data[i]._id + '" data-user="' + data[i].Exec[h]._id + '" />';
          delIDs.push(['del' + delIDCounter, 'deleteAnyShift("' + data[i]._id + '", "' + data[i].Exec[h]._id + ')']);
          delIDCounter = delIDCounter + 1;
        } else if (typeof user === 'object' && user.isAdmin === true) {
          deleteButton = '<span class="otherDel"><input id="del' + delIDCounter + '" type="button" value="✘" ' + delAction + ' class="btn btn-danger btn-xs" data-shift="' + data[i]._id + '" data-user="' + data[i].Exec[h]._id + '" /></span>';
          delIDs.push(['del' + delIDCounter, 'deleteAnyShift("' + data[i]._id + '", "' + data[i].Exec[h]._id + ')']);
          delIDCounter = delIDCounter + 1;
        } else {
          deleteButton = ""
        }
        userName = data[i].Exec[h].firstName + " " + data[i].Exec[h].lastNameInitial;
        profilePicture = data[i].Exec[h].profilePicture.replace("http:", "https:");
        tableText = '<img alt="' + userName + '" class="user" src="' + profilePicture + '" /> ' + userName + ' ' + deleteButton;
      } else {
        tableText = '<form action="volunteerExec" method="post"><input type="text" name="_csrf" value="' + csrf + '" class="csrf"><input type="text" name="shiftID" class="shiftID" value="' + data[i]._id + '"><span class="execBracket">(</span><input ' + action2 + ' value="Exec" class="execButton ' + execClass + '" /><span class="execBracket">)</span></form>'
      }
      line += '<td>' + tableText + '</td>';
    }
    line += "</tr>"
    line += "</tbody>"
    lines += line;
  }

  // Make sure that we actually select the Friday for time zones west of EST
  var thisFriday;
  if (typeof data === "object" && typeof data[0] === "object") {
    if (moment(data[0].date).weekday() !== 5) {
      thisFriday = moment(data[0].date).weekday(5);
    } else {
      thisFriday = moment(data[0].date);
    }
    var datewell = "Volunteering shifts for <strong>" + thisFriday.format("dddd MMMM D, YYYY") + '</strong>:';
    var friday = thisFriday.format("dddd MMMM D, YYYY");
  } else {
    var datewell = "Generating volunteering shifts for this week... Please refresh the page!";
    var friday = "";
  }


  var values = {};
  values.lines = lines;
  values.datewell = datewell;
  values.friday = friday;
  values.delIDs = delIDs;
  return values;
};


function shouldWrite() {
  var now = moment();
  if (now.day() < 5 && now.day() > 0) { // Monday - Thursday: YES
    return true;
  } else if (now.day() === 5 && now.hour() < 17) { // Friday before 5 PM: YES
    return true;
  } else if (now.day() === 5 && now.hour() >= 17) { // Friday after 5 PM: NO
    return false;
  } else if (now.day() === 0 && now.hour() >= 12) { // Sunday after 12 PM: YES
    return true;
  } else if (now.day() === 0 && now.hour() < 12) { // Sunday before 12 PM: NO
    return false;
  } else if (now.day() === 6) { // Saturday: NO
    return false;
  } else {
    console.log("Could not interpret time in shouldWrite. Had now.day() = ", now.day(), "and now.hour() = ", now.hour());
    return false;
  }
}

module.exports = router;
