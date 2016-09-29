var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var Cancelled = require('../models/cancelledModel');
var moment = require('moment');
var csrf = require('csurf');
//var bodyParser = require('body-parser');

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
        var userQuery;
        if (typeof req.user === "undefined") {
          userQuery = "";
          res.render('index', {
            title: 'OSDS Volunteering',
            user: userQuery,
            nonce: res.locals.nonce,
            csrfToken: req.csrfToken(),
            shifts: shifts
          });
        } else {
          userQuery = req.user._id;
          User.findOne({
            _id: userQuery
          }, function (err1, user) {
            if (err1) {
              return console.log(err1);
            }
            res.render('index', {
              title: 'OSDS Volunteering',
              user: user,
              nonce: res.locals.nonce,
              csrfToken: req.csrfToken(),
              shifts: shifts
            });
          });
        }
      });
      // If the week is cancelled...
    } else {
      var userQuery;
      if (typeof req.user === "undefined") {
        userQuery = "";
        res.render('index', {
          title: 'OSDS Volunteering',
          user: userQuery,
          nonce: res.locals.nonce,
          csrfToken: req.csrfToken(),
          shifts: ""
        });
      } else {
        userQuery = req.user._id;
        User.findOne({
          _id: userQuery
        }, function (err1, user) {
          if (err1) {
            return console.log(err1);
          }
          var cancelled = {
            "cancelled": true
          };
          res.render('index', {
            title: 'OSDS Volunteering',
            user: user,
            nonce: res.locals.nonce,
            csrfToken: req.csrfToken(),
            shifts: cancelled
          });
        });
      }
    }
  });
});

/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('login', {
    title: 'OSDS Volunteering - Login'
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

/* GET logins to various services */
router.get('/loginFacebook', passport.authenticate('facebook', {
  scope: ['email'],
  successRedirect: config.opt.base_url + '/',
  failureRedirect: config.opt.base_url + '/login',
  failureFlash: true
}));
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: config.opt.base_url + '/login',
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
  failureRedirect: config.opt.base_url + '/login',
  failureFlash: true
}));
router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: config.opt.base_url + '/login',
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

router.get('/loginLive', passport.authenticate('windowslive', {
  scope: ['wl.signin', 'wl.emails'],
  successRedirect: config.opt.base_url + '/',
  failureRedirect: config.opt.base_url + '/login',
  failureFlash: true
}));
router.get('/auth/live/callback',
  passport.authenticate('windowslive', {
    failureRedirect: config.opt.base_url + '/'
  }),
  function (req, res) {
    User.findById(req.user._id, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Microsoft log-in from", req.user.userName);
        res.cookie('authMethod', "Microsoft", {
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

/* POST CSP Reports */
/*var jsonParser = bodyParser.json({
  type: ['json', 'application/csp-report']
  });
router.post('/csp_reports', jsonParser, function (req, res) {
  if (req.body) {
    console.log('CSP Violation: ', req.body)
  } else {
    console.log('CSP Violation: No data received!')
  }
  res.status(204).end()
});*/

/* GET one's own user profile */
//router.get('/getUser', checkAuth, userController.getUser);

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

module.exports = router;