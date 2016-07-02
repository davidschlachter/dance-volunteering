
var nodemailer = require('nodemailer');
var moment = require('moment');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var shift = require('../controllers/shift');


exports.welcome = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: user.email,
    subject: "Welcome to OSDS Volunteering",
    text: "Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website.",
    html: "<p>Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website.</p>"
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
    if (user.sendDeletedShift != false) {
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
    }
  });
};

exports.newShift = function (userid, uQuery, email) {
  Shift.findOne({
    _id: uQuery._id
  }, function (err, shift) {
    User.findOne({
      _id: userid
    }, function (err, user) {
      if (user.sendNewShift != false) {
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
      }
    });
  });
};

exports.newExecShift = function (userid, uQuery, email) {
  Shift.findOne({
    _id: uQuery._id
  }, function (err, shift) {
    User.findOne({
      _id: userid
    }, function (err, user) {
      if (user.sendNewShift != false) {
        var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
        var date = moment(shift.date).format("MMMM D, YYYY");
        var mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: user.email,
          subject: "Exec volunteer shift on " + date,
          text: "You've signed up for a shift at " + shift.time + " on " + date + ".",
          html: "<p>You've signed up for a shift at " + shift.time + " on " + date + ".</p>"
        };

        transporter.sendMail(mailOpts, function (error, info) {
          if (error) { return console.log(error); }
          console.log('Message sent: ' + info.response);
        });
      }
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
      if (user.sendChangedShift != false) {
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
      }
    });
  });
};



exports.mailOut = function(email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  var query = shift.getFriday(moment());
  var shifts = Shift.find(query).populate({
    path: 'Vol',
    select: '_id firstName lastName email'
  }).populate({
    path: 'Exec',
    select: '_id firstName lastName email'
  }).exec(function(err, results) {
    if (err) {
      return console.log(err)
    }

    var i, j, line, lines = "<table><thead><th>Time</th><th>Volunteer</th></thead><tbody>";
    for (i = 0; i < results.length; i++) {
      if (results[i].Vol.length === 0) {
        line = '<tr><td>' + results[i].time + '</td><td><strong>No volunteers</strong></td></tr>';
        lines += line;
      } else {
        for (j = 0; j < results[i].Vol.length; j++) {
          line = '<tr><td>' + results[i].time + '</td><td>' + results[i].Vol[j].firstName + ' ' + results[i].Vol[j].lastName + '</td></tr>';
          lines += line;
        }
      }
    }
    lines += "</tbody></table>"

    User.find({
      isAdmin: true,
      sendSchedule: true
    }, function(err, results) {
      var i, mailOpts;
      for (i = 0; i < results.length; i++) {
        mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: results[i].email,
          subject: "Volunteering shifts for this week",
          text: "The shifts for this week are:" + lines,
          html: "<p>The shifts for this week are:</p>" + lines
        };
        transporter.sendMail(mailOpts, function(error, info) {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });
      }
    });

  });
};

exports.shiftsAvailable = function(email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
    User.find({
      sendVolunteeringCall: true
    }, function(err, results) {
      var i, mailOpts;
      for (i = 0; i < results.length; i++) {
        mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: results[i].email,
          subject: "Volunteering shifts open for this Friday",
          text: "Hi " + results[i].firstName + "! This is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit https://schlachter.ca/dance-vol/",
          html: "<p>Hi " + results[i].firstName + "! This is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit <a href=\"https://schlachter.ca/dance-vol/\">https://schlachter.ca/dance-vol/</a></p>"
        };
        transporter.sendMail(mailOpts, function(error, info) {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
        });
      }
    });

  });
};