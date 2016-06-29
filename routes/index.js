var express = require('express');
var router = express.Router();
var passport = require('passport');

// Get options from config file
var config = require('../config');

var shift = require('../controllers/shift');

/* GET home page. */
router.get('/', shift.checkShifts, function(req, res, next) {
  res.render('index', { title: 'OSDS Volunteering' });
});

/* GET login page */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'OSDS Volunteering - Login' });
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

module.exports = router;
