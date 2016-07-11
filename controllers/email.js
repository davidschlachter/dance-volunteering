
var nodemailer = require('nodemailer');
var moment = require('moment');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var shift = require('../controllers/shift');
var Cancelled = require('../models/cancelledModel');



exports.welcome = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
    subject: "Welcome to OSDS Volunteering",
    text: "Welcome to OSDS Volunteering!\nEach week you'll get an email reminding you when volunteering shifts open on Monday. When you volunteer, you'll receive a confirmation email each time you volunteer, cancel your shift or change your shift's time. You'll also get a reminder email the Thursday afternoon before your shift.\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs\nSee you on the dance floor!",
    html: "<p>Welcome to OSDS Volunteering!</p><p>Each week you'll get an email reminding you when volunteering shifts open on Monday. When you volunteer, you'll receive a confirmation email each time you volunteer, cancel your shift or change your shift's time. You'll also get a reminder email the Thursday afternoon before your shift. You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p><p>See you on the dance floor!</p>"
  };
  transporter.sendMail(mailOpts, function (error, info) {
    if (error) { return console.log(error); }
    console.log('Welcome message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
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
        to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
        subject: "Cancelled shift on " + date,
        text: "Hi " + user.firstName + "!\nYou've cancelled your shift at " + shift.time + " on " + date + ".\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
        html: "<p>Hi " + user.firstName + "!</p><p>You've cancelled your shift at " + shift.time + " on " + date + ".</p> <p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
      };

      transporter.sendMail(mailOpts, function (error, info) {
        if (error) { return console.log(error); }
        console.log('Cancelled shift message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
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
          to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've signed up for a shift at " + shift.time + " on " + date + ".\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've signed up for a shift at " + shift.time + " on " + date + ".</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
        };

        transporter.sendMail(mailOpts, function (error, info) {
          if (error) { return console.log(error); }
          console.log('New shift message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
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
          to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Exec volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've signed up for a shift at " + shift.time + " on " + date + ".\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've signed up for a shift at " + shift.time + " on " + date + ".</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
        };

        transporter.sendMail(mailOpts, function (error, info) {
          if (error) { return console.log(error); }
          console.log('New exec shift message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
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
          to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Changed time: Volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've changed your volunteer shift on " + date + " from " + oldShift.time + " to " + shift.time + ".\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've changed your volunteer shift on " + date + " from " + oldShift.time + " to <strong>" + shift.time + "</strong>.</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
        };

        transporter.sendMail(mailOpts, function (error, info) {
          if (error) { return console.log(error); }
          console.log('Changed shift message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
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
    select: '_id userName firstName lastName email'
  }).exec(function(err, results) {
    if (err) {return console.log(err);}
    if (results.length) {
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
      lines += "</tbody></table>";

      User.find({
        isAdmin: true,
        sendSchedule: true
      }, function(err, results) {
        var i, mailOpts;
        for (i = 0; i < results.length; i++) {
          mailOpts = {
            from: '"' + email.name + '" <' + email.user + '>',
            to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
            subject: "Volunteering shifts for this week",
            text: "Hi " + results[i].firstName + "!\nThe shifts for this week are:\n" + lines + "\n\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
            html: "<p>Hi " + results[i].firstName + "!</p><p>The shifts for this week are:</p>" + lines + "<p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
          };
          transporter.sendMail(mailOpts, function(error, info) {
            if (error) {
              return console.log(error);
            }
            console.log('Mail out sent to ' + results[i].userName + ', ' + results[i].email + ': ' + info.response);
          });
        }
      });
    }
  });
};

exports.shiftsAvailable = function(email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  var query = shift.getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {return console.log(err0);}
    // If the week isn't cancelled, create the shifts
    if (!results0) {
      User.find({
        sendVolunteeringCall: true
      }, function(err, results) {
        var i, mailOpts;
        for (i = 0; i < results.length; i++) {
          mailOpts = {
            from: '"' + email.name + '" <' + email.user + '>',
            to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
            subject: "Volunteering shifts open for this Friday",
            text: "Hi " + results[i].firstName + "!\nThis is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit https://schlachter.ca/dance-vol/\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
            html: "<p>Hi " + results[i].firstName + "!</p><p>This is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit <a href=\"https://schlachter.ca/dance-vol/\">https://schlachter.ca/dance-vol/</a></p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
          };
          transporter.sendMail(mailOpts, function(error, info) {
            if (error) {return console.log(error);}
            console.log('Shifts available message sent to ' + results[i].userName + ', ' + results[i].email + ': ' + info.response);
          });
        }
      });
    } else {
      // If the week is cancelled, send a different message
      User.find({
        sendVolunteeringCall: true
      }, function(err, users) {
        var i, mailOpts;
        if (users) {
          for (i = 0; i < users.length; i++) {
            console.log("We have:", users[i].userName.replace(/"/g, ''), users[i].email, users[i].firstName, users[i].userName);
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + users[i].userName.replace(/"/g, '') + '" <' + users[i].email + '>',
              subject: "No dance this Friday",
              text: "Hi " + users[i].firstName + "!\nThis is an automatic reminder that there will be no dance this Friday. See you next week! \nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
              html: "<p>Hi " + users[i].firstName + "!</p><p>This is an automatic reminder that there will be no dance this Friday. See you next week! </p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
            };
            transporter.sendMail(mailOpts, function(error, info) {
              if (error) {return console.log(error);}
              console.log('No dance message sent to ' + info.envelope.to[0] + ': ' + info.response);
            });
          }
        }
      });
    }
  });    
};

// Send every volunteer a reminder about their shift on Thusday at 6 PM
exports.reminderVol = function (email) {
  var query = shift.getFriday(moment());
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {return console.log(err0);}
    // If the week isn't cancelled, create the shifts
    if (!results0) {
      Shift.find(query).populate({
        path: 'Vol',
        select: 'userName firstName lastName email sendReminder'
      }).exec(function (err, shifts) {
        if (err) {return console.log(err);}
        var date = moment(shifts[0].date).format("MMMM D, YYYY");
        var i, j, mailOpts;
        for (i = 0; i < shifts.length; i++) {
          if (shifts[i].Vol && shifts[i].Vol.constructor === Array) {
            for (j = 0; j < shifts[i].Vol.length; j++) {
              if (shifts[i].Vol[j] !== null && typeof shifts[i].Vol[j] === 'object' && shifts[i].Vol[j].sendReminder === true) {
                mailOpts = {
                  from: '"' + email.name + '" <' + email.user + '>',
                  to: '"' + shifts[i].Vol[j].userName.replace(/"/g, '') + '" <' + shifts[i].Vol[j].email + '>',
                  subject: "Reminder: volunteer shift tomorrow, " + shifts[i].time,
                  text: "Hi " + shifts[i].Vol[j].firstName + "!\nThis is reminder for your volunteering shift tomorrow (" + date + "), " + shifts[i].time + ". If you need to make any changes to your shift, visit https://schlachter.ca/dance-vol/. See you on the dance floor!\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
                  html: "<p>Hi " + shifts[i].Vol[j].firstName + "!</p><p>This is reminder for your volunteering shift tomorrow (" + date + "), " + shifts[i].time + ". If you need to make any changes to your shift, visit <a href=\"https://schlachter.ca/dance-vol/\">https://schlachter.ca/dance-vol/</a>. See you on the dance floor!</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
                };

                transporter.sendMail(mailOpts, function (error, info) {
                  if (error) { return console.log(error); }
                  console.log('Reminder message sent to ' + shifts[i].Vol[j].userName + ', ' + shifts[i].Vol[j].email + ': ' + info.response);
                });
              }
            }
          }
        }

      });
      return;
    } else {
      // If the week is cancelled, don't do anything
      return;
    }
  });
};


// Send each volunteer a thank you note on Saturday morning
exports.thankVol = function (email) {
  var query = shift.getFriday(moment());
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  Shift.find(query).populate({
    path: 'Vol',
    select: 'userName firstName lastName email sendReminder'
  }).exec(function (err, shifts) {
    if (err) {return console.log(err);}
    var date = moment(shifts[0].date).format("MMMM D, YYYY");
    var i, j, mailOpts;
    for (i = 0; i < shifts.length; i++) {
      if (shifts[i].Vol && shifts[i].Vol.constructor === Array) {
        for (j = 0; j < shifts[i].Vol.length; j++) {
          if (shifts[i].Vol[j] !== null && typeof shifts[i].Vol[j] === 'object' && shifts[i].Vol[j].sendReminder === true) {
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + shifts[i].Vol[j].userName.replace(/"/g, '') + '" <' + shifts[i].Vol[j].email + '>',
              subject: "Thank you for volunteering!",
              text: "Hi " + shifts[i].Vol[j].firstName + "!\nJust a quick note to say thank you for volunteering this week! Shifts for next Friday open on Monday. Hope to see you again soon!\n\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
              html: "<p>Hi " + shifts[i].Vol[j].firstName + "!</p><p>Just a quick note to say thank you for volunteering this week! Shifts for next Friday open on Monday. Hope to see you again soon!</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
            };

            transporter.sendMail(mailOpts, function (error, info) {
              if (error) { return console.log(error); }
              console.log('Thank you message sent to ' + shifts[i].Vol[j].userName + ', ' + shifts[i].Vol[j].email + ': ' + info.response);
            });
          }
        }
      }
    }

  });
};


exports.newAdmin = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
    subject: "OSDS Volunteering: You've been added as an admin",
    text: "Hi " + user.firstName + "!\nYou've been made an admin on the OSDS Volunteering site. You can now see contact details for volunteers, and you'll receive the volunteering schedule for each week on Fridays at 5 PM.\nCheck it out at https://schlachter.ca/dance-vol/!\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
    html: "<p>Hi " + user.firstName + "!</p><p>You've been made an admin on the OSDS Volunteering site. You can now see contact details for volunteers, and you'll receive the volunteering schedule by email on Fridays at 5 PM.</p><p>Check it out at <a href=\"https://schlachter.ca/dance-vol/\">https://schlachter.ca/dance-vol/</a>!</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
  };
  transporter.sendMail(mailOpts, function (error, info) {
    if (error) { return console.log(error); }
    console.log('New admin message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
  });
};

exports.removedAdmin = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + user.userName.replace(/"/g, '') + '" <' + user.email + '>',
    subject: "OSDS Volunteering: You've been removed as an admin",
    text: "Hi " + user.firstName + "!\nThis is a notification that you're no longer an admin on the OSDS Volunteering site.",
    html: "<p>Hi " + user.firstName + "!</p><p>This is a notification that you're no longer an admin on <a href=\"https://schlachter.ca/dance-vol/\">the OSDS Volunteering site</a>.</p>"
  };
  transporter.sendMail(mailOpts, function (error, info) {
    if (error) { return console.log(error); }
    console.log('Removed admin message sent to ' + user.userName + ', ' + user.email + ': ' + info.response);
  });
};

// Send a 'last-call' email if any shifts are available on Friday mid-day
exports.lastCall = function(email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  var query = shift.getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {return console.log(err0);}
    // If the week isn't cancelled, create the shifts
    if (!results0) {
      var shifts = Shift.find(query).exec(function(err, results) {
        if (err) {return console.log(err);}

        var i, j, line, lines = "<table><thead><th>Time</th></thead><tbody>";
        for (i = 0; i < results.length; i++) {
          if (results[i].Vol.length < results[i].nVol) {
            line = '<tr><td>' + results[i].time + '</td></tr>';
            lines += line;
          }
        }
        lines += "</tbody></table>";

        User.find({
          sendLastCall: true
        }, function(err, results) {
          var i, mailOpts;
          for (i = 0; i < results.length; i++) {
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
              subject: "Last call: volunteering shifts still available",
              text: "Hi " + results[i].firstName + "!\nThese volunteering shifts still available for tonight's dance:\n" + lines + "\nYou can sign up for a shift today until 5 PM on the volunteering page: https://schlachter.ca/dance-vol/\n\nYou can configure your email preferences on the volunteering website: https://schlachter.ca/dance-vol/#emailPrefs",
              html: "<p>Hi " + results[i].firstName + "!</p><p>These volunteering shifts still available for tonight's dance:</p>" + lines + "<p>You can sign up for a shift today until 5 PM on <a href=\"https://schlachter.ca/dance-vol/\">the volunteering page</a>.</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"https://schlachter.ca/dance-vol/#emailPrefs\">the volunteering website</a>.</p>"
            };
            transporter.sendMail(mailOpts, function(error, info) {
              if (error) {
                return console.log(error);
              }
              console.log('Mail out sent to ' + results[i].userName + ', ' + results[i].email + ': ' + info.response);
            });
          }
        });

      });
      return;
    } else {
      // If the week is cancelled, don't do anything
      return;
    }
  });
};

