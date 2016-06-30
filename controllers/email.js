
var nodemailer = require('nodemailer');
var moment = require('moment');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');


exports.welcome = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: user.email,
    subject: "Welcome to OSDS Volunteering",
    text: "Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website",
    html: "<p>Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website</p>"
  };
  transporter.sendMail(mailOpts, function (error, info) {
    if (error) { return console.log(error); }
    console.log('Message sent: ' + info.response);
  });
};

exports.cancelled = function (userid, shift, email) {
  User.findOne({
    _id: userid
  }, function (err, user) {
    var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
    var date = moment(query.date).format("MMMM D, YYYY");
    var mailOpts = {
      from: '"' + email.name + '" <' + email.user + '>',
      to: user.email,
      subject: "Cancelled shift on " + date,
      text: "You've cancelled your shift at " + shift.time + " on " + date + ".",
      html: "<p>You've cancelled your shift at " + shift.time + " on " + date + ".</p>"
    };

    transporter.sendMail(mailOpts, function (error, info) {
      if (error) { return console.log(error); }
      console.log('Message sent: ' + info.response);
    });
  });
};

exports.newShift = function (userid, uQuery, email) {
  Shift.findOne({
    _id: uQuery._id
  }, function (err, shift) {
    User.findOne({
      _id: userid
    }, function (err, user) {
      var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
      var date = moment(shift.date).format("MMMM D, YYYY");
      var mailOpts = {
        from: '"' + email.name + '" <' + email.user + '>',
        to: user.email,
        subject: "Volunteer shift on " + date,
        text: "You've signed up for a shift at " + shift.time + " on " + date + ".",
        html: "<p>You've signed up for a shift at " + shift.time + " on " + date + ".</p>"
      };

      transporter.sendMail(mailOpts, function (error, info) {
        if (error) { return console.log(error); }
        console.log('Message sent: ' + info.response);
      });
    });
  });
};

exports.switching = function (userid, oldShift, uQuery, email) {
  Shift.findOne({
    _id: uQuery._id
  }, function (err, shift) {
    User.findOne({
      _id: userid
    }, function (err, user) {
      var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
      var date = moment(shift.date).format("MMMM D, YYYY");
      var mailOpts = {
        from: '"' + email.name + '" <' + email.user + '>',
        to: user.email,
        subject: "Changed time: Volunteer shift on " + date,
        text: "You've changed your volunteer shift on " + date + " from " + oldShift.time + " to " + shift.time + ".",
        html: "<p>You've changed your volunteer shift on " + date + " from " + oldShift.time + " to <strong>" + shift.time + "</strong>.</p>"
      };

      transporter.sendMail(mailOpts, function (error, info) {
        if (error) { return console.log(error); }
        console.log('Message sent: ' + info.response);
      });
    });
  });
};