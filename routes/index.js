var express = require('express');
var router = express.Router();
var passport = require('passport');

// Get options from config file
var config = require('../config');

var shift = require('../controllers/shift');

/* GET home page. */
router.get('/', shift.checkShifts, function (req, res, next) {
  var user;
  if (typeof req.user == "undefined") {user = "";} else {user = req.user;}
  res.render('index', { title: 'OSDS Volunteering', user: user });
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

/* POST to delete user's own shift */
router.post('/deleteMyShift', checkAuth, shift.deleteMyShift, function (req, res, next) {
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
    console.log("Facebook log-in from", req.user);
    res.redirect(config.opt.base_url + '/');
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
    console.log("Google log-in from", req.user);
    res.redirect(config.opt.base_url + '/');
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
    console.log("Windows log-in from", req.user);
    res.redirect(config.opt.base_url + '/');
  });

/* GET the shifts */
router.get('/getShifts', shift.getShifts);

/* Check if authenticated */
function checkAuth(req, res, next) {
  if (req.user) {
    next();
  } else {
    if (typeof req.body.shiftID != "undefined") {res.cookie('shiftID', req.body.shiftID, {path: '/'});}
    res.redirect(config.opt.base_url + '/login');
  }
}

module.exports = router;
