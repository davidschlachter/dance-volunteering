var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var moment = require('moment');

// Get options from config file
var config = require('../config');

var shift = require('../controllers/shift');
var userController = require('../controllers/user');

var cookieExpiryDate = new Date(Number(new Date()) + 31536000000);

/* GET home page. */

router.get('/', shift.checkShifts, function (req, res, next) {
  // Send the userID if logged in
  var user;
  if (typeof req.user == "undefined") {user = "";} else {user = req.user;}
  // Send the shifts
  var query = shift.getFriday(moment());
  var shifts = Shift.find(query).populate({
    path: 'Vol',
    select: '_id firstName lastNameInitial profilePicture'
  }).populate({
    path: 'Exec',
    select: '_id firstName lastNameInitial profilePicture'
  }).exec(function (err, results) {
    if (err) {return console.log(err);}
    res.render('index', {title: 'OSDS Volunteering', user: user, shifts: results });
  });
});

/* GET login page */
router.get('/login', function (req, res, next) {
  res.render('login', { title: 'OSDS Volunteering - Login' });
});

/* GET logout */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect(config.opt.base_url + '/');
});

/* POST to volunteer for a shift */
router.post('/volunteer', checkAuth, shift.volunteer, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to volunteer for an exec shift */
router.post('/volunteerExec', checkAuth, checkExec, shift.volunteerExec, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to delete user's own shift */
router.post('/deleteMyShift', checkAuth, shift.deleteMyShift, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to delete exec's own shift */
router.post('/deleteAnyShift', checkAuth, checkExec, shift.deleteAnyShift, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST to change email preferences */
router.post('/emailPrefs', checkAuth, userController.emailPrefs, function (req, res, next) {
  res.redirect(config.opt.base_url + '/');
});

/* POST logins to various services */
router.get('/loginFacebook', passport.authenticate('facebook', {
  scope: [ 'email' ],
  successRedirect: config.opt.base_url + '/',
  failureRedirect: config.opt.base_url + '/login',
  failureFlash: true
}));
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: config.opt.base_url + '/login',
  }),
  function (req, res) {
    User.findById(req.user._id, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Facebook log-in from", req.user);
        res.cookie('authMethod', "Facebook", {path: '/', expires: cookieExpiryDate});
        res.cookie('userName', user.firstName, {path: '/', expires: cookieExpiryDate});
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
    User.findById(req.user._id, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Google log-in from", req.user);
        res.cookie('authMethod', "Google", {path: '/', expires: cookieExpiryDate});
        res.cookie('userName', user.firstName, {path: '/', expires: cookieExpiryDate});
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
    User.findById(req.user._id, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect(config.opt.base_url + '/');
      } else {
        console.log("Microsoft log-in from", req.user);
        res.cookie('authMethod', "Microsoft", {path: '/', expires: cookieExpiryDate});
        res.cookie('userName', user.firstName, {path: '/', expires: cookieExpiryDate});
        res.redirect(config.opt.base_url + '/');
      }
    });
  });

/* GET the shifts */
router.get('/getShifts', shift.getShifts);

/* Get volunteer details */
router.get('/getDetails', checkAuth, checkExec, shift.getDetails);

/* Get list of admins */
router.get('/getAdmins', checkAuth, checkExec, userController.getAdmins);

/* POST to add a user as an admin */
router.post('/makeAdmin', checkAuth, checkExec, userController.makeAdmin);

/* POST to add a user as an admin */
router.post('/removeAdmin', checkAuth, checkExec, userController.removeAdmin);

/* Get users for admin adding */
router.get('/searchAdmins', checkAuth, checkExec, userController.searchAdmins);

/* GET one's own user profile */
router.get('/getUser', checkAuth, userController.getUser);

/* Check if authenticated */
function checkAuth(req, res, next) {
  if (req.user) {
    next();
  } else {
    if (typeof req.body.shiftID != "undefined") {res.cookie('shiftID', req.body.shiftID, {path: '/'});}
    res.redirect(config.opt.base_url + '/login');
  }
}

/* Check if exec */
function checkExec(req, res, next) {
  User.findById(req.user._id, function(err, user) {
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
