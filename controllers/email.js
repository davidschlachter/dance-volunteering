var nodemailer = require('nodemailer');
var moment = require('moment');
var User = require('../models/userModel');
var Shift = require('../models/shiftModel');
var Template = require('../models/templateModel');
var shift = require('../controllers/shift');
var Cancelled = require('../models/cancelledModel');
var retry = require('retry');
var Entities = require('html-entities').Html5Entities;
var entities = new Entities();
var crypto = require('crypto');
var ics = require('ics');

var config = require('../config');
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: config.opt.email.user,
    pass: config.opt.email.pass
  },
  pool: true
});

exports.welcome = function (user, email) {
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
    subject: "Welcome to " + config.opt.title,
    text: "Welcome to " + config.opt.title + "!\nEach week you'll get an email reminding you when volunteering shifts open on Sunday at 12 PM. When you volunteer, you'll receive a confirmation email each time you volunteer, cancel your shift or change your shift's time. You'll also get a reminder email the Thursday afternoon before your shift.\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs\nPlease be sure to read the OSDS Volunteer Handbook before your first shift: http://bit.ly/osdsvolhandbook\nSee you on the dance floor!",
    html: "<p>Welcome to " + config.opt.title + "!</p><p>Each week you'll get an email reminding you when volunteering shifts open on Sunday at 12 PM. When you volunteer, you'll receive a confirmation email each time you volunteer, cancel your shift or change your shift's time. You'll also get a reminder email the Thursday afternoon before your shift. You can configure your email preferences on <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=welcome\">the volunteering website</a>.</p><p>Please be sure to read the OSDS Volunteer Handbook before your first shift: <a href=\"http://bit.ly/osdsvolhandbook\">http://bit.ly/osdsvolhandbook</a></p><p>See you on the dance floor!</p>"
  };

  faultTolerantSend(function (err, info) {}, email, mailOpts, "Welcome message ");
};

exports.cancelled = function (userid, shift, email) {
  User.findOne({
    _id: userid
  }, function (err, user) {
    if (user.sendDeletedShift != false) {
      var date = moment(query.date).format("MMMM D, YYYY");
      var link = crypto.createHmac('sha1', config.opt.linkSecret).update(user.id).digest('hex');
      var mailOpts = {
        from: '"' + email.name + '" <' + email.user + '>',
        to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
        subject: "Cancelled shift on " + date,
        text: "Hi " + user.firstName + "!\nYou've cancelled your shift at " + shift.time + " on " + date + ".\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
        html: "<p>Hi " + user.firstName + "!</p><p>You've cancelled your shift at " + shift.time + " on " + date + ".</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendDeletedShift&id=" + user.id + "\">Turn off cancelled shift emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=cancelled\">Configure email preferences</a></p>"
      };

      faultTolerantSend(function (err, info) {}, email, mailOpts, "Cancelled shift message ");


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
        var date = moment(shift.date).format("MMMM D, YYYY");
        var shiftStart, shiftDate, shiftTime;
        if (Number(shift.time.match(/([\d]+):\d\d/)[1]) > 11) {
          shiftDate = moment(shift.date).add(1, "day");
          shiftTime = moment(shift.time.match(/[\d]+:\d\d/)[0] + " AM", ["h:mm A"]);
          shiftStart = moment(shiftDate.format("MMMM D, YYYY") + " " + shiftTime.format("h:mm A"), "MMMM D, YYYY h:mm A");
        } else {
          shiftTime = moment(shift.time.match(/[\d]+:\d\d/)[0] + " PM", ["h:mm A"]);
          shiftStart = moment(moment(shift.date).format("MMMM D, YYYY") + " " + shiftTime.format("h:mm A"), "MMMM D, YYYY h:mm A");
        }
        var link = crypto.createHmac('sha1', config.opt.linkSecret).update(user.id).digest('hex');
        const event = {
          start: [ shiftStart.year(), shiftStart.month()+1, shiftStart.date(), shiftStart.hour(), shiftStart.minute(), shiftStart.second() ],
          duration: {minutes: 30}, // Danger: assumes 30 minutes shifts TODO would calculate this somehow
          title: config.opt.title + ' Shift',
          description: 'Volunteering shift at the Ottawa Swing Dance Society',
          location: '174 Wilbrod St, Ottawa, ON K1N 6N8',
          url: 'https://volunteer.swingottawa.ca/',
          status: 'CONFIRMED',
          geo: {
            lat: 45.425495,
            lon: -75.685101
          },
          organizer: {
            name: email.name,
            email: email.user.replace("%40", "@")
          },
          attendees: [{
            name: entities.decode(user.userName).replace(/"/g, ''),
            email: user.email
          }]
        };
        var eventString;
        ics.createEvent(event, (error, value) => {
          if (error) {
            console.log(error);
          }
        	eventString = value;
        });
        var mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've signed up for a shift at " + shift.time + " on " + date + ".\nPlease be sure that you have read and are familiar with the OSDS Volunteer Handbook: http://bit.ly/osdsvolhandbook\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've signed up for a shift at " + shift.time + " on " + date + ".</p><p>Please be sure that you have read and are familiar with the OSDS Volunteer Handbook: <a href=\"http://bit.ly/osdsvolhandbook\">http://bit.ly/osdsvolhandbook</a></p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendNewShift&id=" + user.id + "\">Turn off new shift emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=newshift\">Configure email preferences</a></p>",
          alternatives: [{
            contentType: 'text/calendar',
            content: eventString
          }]
        };


        faultTolerantSend(function (err, info) {}, email, mailOpts, "New shift message ");

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
        var date = moment(shift.date).format("MMMM D, YYYY");
        var link = crypto.createHmac('sha1', config.opt.linkSecret).update(user.id).digest('hex');
        var mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Exec volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've signed up for a shift at " + shift.time + " on " + date + ".\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've signed up for a shift at " + shift.time + " on " + date + ".</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendNewShift&id=" + user.id + "\">Turn off new shift emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=execshift\">Configure email preferences</a></p>"
        };


        faultTolerantSend(function (err, info) {}, email, mailOpts, "New exec shift message ");
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
        var date = moment(shift.date).format("MMMM D, YYYY");
        var link = crypto.createHmac('sha1', config.opt.linkSecret).update(user.id).digest('hex');
        var mailOpts = {
          from: '"' + email.name + '" <' + email.user + '>',
          to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
          subject: "Changed time: Volunteer shift on " + date,
          text: "Hi " + user.firstName + "!\nYou've changed your volunteer shift on " + date + " from " + oldShift.time + " to " + shift.time + ".\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
          html: "<p>Hi " + user.firstName + "!</p><p>You've changed your volunteer shift on " + date + " from " + oldShift.time + " to <strong>" + shift.time + "</strong>.</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendChangedShift&id=" + user.id + "\">Turn off changed shift emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=changedshift\">Configure email preferences</a></p>"
        };

        faultTolerantSend(function (err, info) {}, email, mailOpts, "Changed shift message ");
      }
    });
  });
};



exports.mailOut = function (email) {
  var query = shift.getFriday(moment());
  var shifts = Shift.find(query, null, {
    sort: {
      index: 1
    }
  }).populate({
    path: 'Vol',
    select: '_id firstName lastNameInitial email isNewUser'
  }).populate({
    path: 'Exec',
    select: '_id userName firstName lastNameInitial email'
  }).exec(function (err, results) {
    if (err) {
      return console.log(err);
    }
    if (results.length) {
      var i, j, newUser, line, lines = '<table style="border-collapse: collapse;"><thead><th style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">Time</th><th style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">Volunteer</th></thead><tbody>';
      for (i = 0; i < results.length; i++) {
        if (results[i].Vol.length === 0) {
          line = '<tr><td style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">' + results[i].time + '</td><td style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;"><strong>No volunteers</strong></td></tr>';
          lines += line;
        } else {
          for (j = 0; j < results[i].Vol.length; j++) {
            if (results[i].Vol[j].isNewUser === true) {
              newUser = ' <em>(New volunteer)</em>';
            } else {
              newUser = '';
            }
            line = '<tr><td style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">' + results[i].time + '</td><td style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">' + results[i].Vol[j].firstName + ' ' + results[i].Vol[j].lastNameInitial + newUser + '</td></tr>';
            lines += line;
          }
        }
      }
      lines += "</tbody></table>";

      User.find({
        isAdmin: true,
        sendSchedule: true
      }, function (err, results) {
        var i, mailOpts, link;
        for (i = 0; i < results.length; i++) {
          link = crypto.createHmac('sha1', config.opt.linkSecret).update(results[i].id).digest('hex');
          mailOpts = {
            from: '"' + email.name + '" <' + email.user + '>',
            to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
            subject: "Volunteering shifts for this week",
            text: "Hi " + results[i].firstName + "!\nThe shifts for this week are:\n" + lines.replace(/<\/td><td style\="padding\: 0\.2em 1em 0\.2em 0\.2em;border-bottom\: 1px solid gray;">/g, ' ').replace(/<\/td><\/tr>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, '').replace(/<tr><td style\="padding\: 0\.2em 1em 0\.2em 0\.2em;border-bottom\: 1px solid gray;">/g, '').replace(/<br>/g, ' ').replace('</tbody></table>', '').replace('<table style="border-collapse: collapse;"><thead><th style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">Time</th><th style="padding: 0.2em 1em 0.2em 0.2em;border-bottom: 1px solid gray;">Volunteer</th></thead><tbody>', '\n') + "\nYou can print the full schedule on the volunteering website. \n\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
            html: "<p>Hi " + results[i].firstName + "!</p><p>The shifts for this week are:</p>" + lines + "<p>You can print the full schedule on <a href=\"" + config.opt.full_url + "/?ref=mailOut\">the volunteering website</a>.</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendSchedule&id=" + results[i].id + "\">Turn off weekly schedule emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=mailOut\">Configure email preferences</a></p>"
          };

          faultTolerantSend(function (err, info) {}, email, mailOpts, "Mail out message ");


        }
      });
    }
  });
};

exports.shiftsAvailable = function (email) {
  var query = shift.getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {
      return console.log(err0);
    }
    // If the week isn't cancelled, create the shifts
    if (!results0) {
      User.find({
        sendVolunteeringCall: true
      }, function (err, results) {
        var i, mailOpts, link;
        for (i = 0; i < results.length; i++) {
          link = crypto.createHmac('sha1', config.opt.linkSecret).update(results[i].id).digest('hex');
          mailOpts = {
            from: '"' + email.name + '" <' + email.user + '>',
            to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
            subject: "Volunteering shifts open for this Friday",
            text: "Hi " + results[i].firstName + "!\nThis is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit " + config.opt.full_url + "/\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
            html: "<p>Hi " + results[i].firstName + "!</p><p>This is an automatic reminder that volunteering shifts for this Friday are now open. To sign up, visit <a href=\"" + config.opt.full_url + "/?ref=shiftsAvailable\">" + config.opt.full_url + "/</a></p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendVolunteeringCall&id=" + results[i].id + "\">Turn off weekly volunteering call emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=shiftsAvailable\">Configure email preferences</a></p>"
          };

          faultTolerantSend(function (err, info) {
            console.log("cb returned err", err, "info", info)
          }, email, mailOpts, "Shifts available message ");

        }
      });
    } /*else if (results0.actuallyCancelled) {
      // If the week is actually cancelled, send a different message
      User.find({
        sendVolunteeringCall: true
      }, function (err, users) {
        var i, mailOpts, link;
        if (users) {
          for (i = 0; i < users.length; i++) {
            console.log("We have:", users[i].userName.replace(/"/g, ''), users[i].email, users[i].firstName, users[i].userName);
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + users[i].userName.replace(/"/g, '') + '" <' + users[i].email + '>',
              subject: "No dance this Friday",
              text: "Hi " + users[i].firstName + "!\nThis is an automatic reminder that there will be no dance this Friday. See you next time! \nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
              html: "<p>Hi " + users[i].firstName + "!</p><p>This is an automatic reminder that there will be no dance this Friday. See you next time! </p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"" + config.opt.full_url + "/#emailPrefs\">the volunteering website</a>.</p>"
            };

            faultTolerantSend(function (err, info) {}, email, mailOpts, "No dance message ");


          }
        }
      });
    } */ else {
      // If the volunteering tool isn't being used, don't do anything
      console.log("Skipped sending volunteering call -- not using the tool this week");
    }
  });
};

// Send every volunteer a reminder about their shift on Thusday at 6 PM
exports.reminderVol = function (email) {
  var query = shift.getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {
      return console.log(err0);
    }
    if (!results0) {
      Shift.find(query).populate({
        path: 'Vol',
        select: 'userName firstName lastName email sendReminder'
      }).exec(function (err, shifts) {
        if (err) {
          return console.log(err);
        }
        var date = moment(shifts[0].date).format("MMMM D, YYYY");
        var i, j, mailOpts, link;
        for (i = 0; i < shifts.length; i++) {
          if (shifts[i].Vol && shifts[i].Vol.constructor === Array) {
            for (j = 0; j < shifts[i].Vol.length; j++) {
              if (shifts[i].Vol[j] !== null && typeof shifts[i].Vol[j] === 'object' && shifts[i].Vol[j].sendReminder === true) {
                link = crypto.createHmac('sha1', config.opt.linkSecret).update(shifts[i].Vol[j].id).digest('hex');
                mailOpts = {
                  from: '"' + email.name + '" <' + email.user + '>',
                  to: '"' + shifts[i].Vol[j].userName.replace(/"/g, '') + '" <' + shifts[i].Vol[j].email + '>',
                  subject: "Reminder: volunteer shift tomorrow, " + shifts[i].time.replace(/<br>/g, ' '),
                  text: "Hi " + shifts[i].Vol[j].firstName + "!\nThis is reminder for your volunteering shift tomorrow (" + date + "), " + shifts[i].time + ". If you need to make any changes to your shift, visit " + config.opt.full_url + "/. See you on the dance floor!\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
                  html: "<p>Hi " + shifts[i].Vol[j].firstName + "!</p><p>This is reminder for your volunteering shift tomorrow (" + date + "), " + shifts[i].time + ". If you need to make any changes to your shift, visit <a href=\"" + config.opt.full_url + "/?ref=reminder\">" + config.opt.full_url + "/</a>. See you on the dance floor!</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendReminder&id=" + shifts[i].Vol[j].id + "\">Turn off weekly reminder emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=reminder\">Configure email preferences</a></p>"
                };



                faultTolerantSend(function (err, info) {}, email, mailOpts, "Reminder message ");

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
  Shift.find(query).populate({
    path: 'Vol',
    select: 'userName firstName lastName email sendThanks'
  }).exec(function (err, shifts) {
    if (err) {
      return console.log(err);
    }
    if (!shifts.length) {
      return console.log("No shifts this week -- not sending thank you emails");
    }
    var date = moment(shifts[0].date).format("MMMM D, YYYY");
    var i, j, mailOpts, link;
    for (i = 0; i < shifts.length; i++) {
      if (shifts[i].Vol && shifts[i].Vol.constructor === Array) {
        for (j = 0; j < shifts[i].Vol.length; j++) {
          if (shifts[i].Vol[j] !== null && typeof shifts[i].Vol[j] === 'object' && shifts[i].Vol[j].sendThanks === true) {
            link = crypto.createHmac('sha1', config.opt.linkSecret).update(shifts[i].Vol[j].id).digest('hex');
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + shifts[i].Vol[j].userName.replace(/"/g, '') + '" <' + shifts[i].Vol[j].email + '>',
              subject: "Thank you for volunteering!",
              text: "Hi " + shifts[i].Vol[j].firstName + "!\nJust a quick note to say thank you for volunteering this week! Shifts for next Friday open on Sunday at 12 PM. Hope to see you again soon!\n\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
              html: "<p>Hi " + shifts[i].Vol[j].firstName + "!</p><p>Just a quick note to say thank you for volunteering this week! Shifts for next Friday open on Sunday at 12 PM. Hope to see you again soon!</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendThanks&id=" + shifts[i].Vol[j].id + "\">Turn off thank you emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=thankyou\">Configure email preferences</a></p>"
            };


            faultTolerantSend(function (err, info) {}, email, mailOpts, "Thank you message ");


          }
        }
      }
    }

  });
};


exports.newAdmin = function (user, email) {

  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
    subject: config.opt.title + ": You've been added as an admin",
    text: "Hi " + user.firstName + "!\nYou've been made an admin on the " + config.opt.title + " site. You can now see contact details for volunteers, and you'll receive the volunteering schedule for each week on Fridays at 5 PM.\nCheck it out at " + config.opt.full_url + "/!\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
    html: "<p>Hi " + user.firstName + "!</p><p>You've been made an admin on the " + config.opt.title + " site. You can now see contact details for volunteers, and you'll receive the volunteering schedule by email on Fridays at 5 PM.</p><p>Check it out at <a href=\"" + config.opt.full_url + "/?ref=newadmin\">" + config.opt.full_url + "/</a>!</p><p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=newadmin\">the volunteering website</a>.</p>"
  };


  faultTolerantSend(function (err, info) {}, email, mailOpts, "New admin message ");

};

exports.removedAdmin = function (user, email) {

  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: '"' + entities.decode(user.userName).replace(/"/g, '') + '" <' + user.email + '>',
    subject: config.opt.title + ": You've been removed as an admin",
    text: "Hi " + user.firstName + "!\nThis is a notification that you're no longer an admin on the " + config.opt.title + " site.",
    html: "<p>Hi " + user.firstName + "!</p><p>This is a notification that you're no longer an admin on <a href=\"" + config.opt.full_url + "/?ref=removedadmin\">the " + config.opt.title + " site</a>.</p>"
  };


  faultTolerantSend(function (err, info) {}, email, mailOpts, "Removed admin message ");

};

// Send a 'last-call' email if any shifts are available on Friday mid-day
exports.lastCall = function (email) {
  var query = shift.getFriday(moment());
  Cancelled.findOne(query, function (err0, results0) {
    if (err0) {
      return console.log(err0);
    }
    // If the week isn't cancelled, continue
    if (!results0) {
      var shifts = Shift.find(query, null, {
        sort: {
          index: 1
        }
      }).exec(function (err, results1) {
        if (err) {
          return console.log(err);
        }

        var i, j, line, lines = "<table><thead><th>Time</th></thead><tbody>";
        var linesNewUsers = "<table><thead><th>Time</th></thead><tbody>";
        var shouldSend = false;
        var shouldSendNewUsers = false;
        // For regular users
        for (i = 0; i < results1.length; i++) {
          if (results1[i].Vol.length < results1[i].nVol) {
            line = '<tr><td>' + results1[i].time + '</td></tr>';
            lines += line;
            shouldSend = true;
          }
        }
        lines += "</tbody></table>";
        lines = lines.replace(/<br>/g, ' ');
        // For new users
        for (i = 0; i < results1.length; i++) {
          if (results1[i].Vol.length < results1[i].nVol && results1[i].newUsers === true) {
            line = '<tr><td>' + results1[i].time + '</td></tr>';
            linesNewUsers += line;
            shouldSendNewUsers = true;
          }
        }
        linesNewUsers += "</tbody></table>";
        linesNewUsers = linesNewUsers.replace(/<br>/g, ' ');
        
        if (shouldSend === false) {
          return console.log("No shifts are available -- not sending any lastCall");
        }
        User.find({
          sendLastCall: true,
          isNewUser: false
        }, function (err, results2) {
          var i, j, k, l, mailOpts, link;
          for (j = 0; j < results2.length; j++) {
            for (k = 0; k < results1.length; k++) {
              for (l = 0; l < results1[k].Vol.length; l++) {
                if (results1[k] && results1[k].Vol && results1[k].Vol.length > 0 && results2[j] && results2[j]._id && results2[j]._id.toString().indexOf(results1[k].Vol[l]) === 0) {
                  results2.splice(j, 1);
                }
              }
            }
          }
          for (i = 0; i < results2.length; i++) {
            link = crypto.createHmac('sha1', config.opt.linkSecret).update(results2[i].id).digest('hex');
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + results2[i].userName.replace(/"/g, '') + '" <' + results2[i].email + '>',
              subject: "Last call: volunteering shifts still available",
              text: "Hi " + results2[i].firstName + "!\nThese volunteering shifts still available for tonight's dance:\n" + lines + "\nYou can sign up for a shift today until 5 PM on the volunteering page: " + config.opt.full_url + "/\n\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
              html: "<p>Hi " + results2[i].firstName + "!</p><p>These volunteering shifts still available for tonight's dance:</p>" + lines + "<p>You can sign up for a shift today until 5 PM on <a href=\"" + config.opt.full_url + "/?ref=lastcall\">the volunteering page</a>.</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendLastCall&id=" + results2[i].id + "\">Turn off last call emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=lastcall\">Configure email preferences</a></p>"
            };


            faultTolerantSend(function (err, info) {}, email, mailOpts, "Last call message ");

          }
        });
        
        
        // Repeat of the sending routine, just for the new users email!
        if (shouldSendNewUsers === false) {
          return console.log("No shifts available for new users -- not sending them the lastCall");
        }
        User.find({
          sendLastCall: true,
          isNewUser: true
        }, function (err, results2) {
          var i, j, k, l, mailOpts, link;
          for (j = 0; j < results2.length; j++) {
            for (k = 0; k < results1.length; k++) {
              for (l = 0; l < results1[k].Vol.length; l++) {
                if (results1[k] && results1[k].Vol && results1[k].Vol.length > 0 && results2[j] && results2[j]._id && results2[j]._id.toString().indexOf(results1[k].Vol[l]) === 0) {
                  results2.splice(j, 1);
                }
              }
            }
          }
          for (i = 0; i < results2.length; i++) {
            link = crypto.createHmac('sha1', config.opt.linkSecret).update(results2[i].id).digest('hex');
            mailOpts = {
              from: '"' + email.name + '" <' + email.user + '>',
              to: '"' + results2[i].userName.replace(/"/g, '') + '" <' + results2[i].email + '>',
              subject: "Last call: volunteering shifts still available",
              text: "Hi " + results2[i].firstName + "!\nThese volunteering shifts still available for tonight's dance:\n" + linesNewUsers + "\nYou can sign up for a shift today until 5 PM on the volunteering page: " + config.opt.full_url + "/\n\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
              html: "<p>Hi " + results2[i].firstName + "!</p><p>These volunteering shifts still available for tonight's dance:</p>" + linesNewUsers + "<p>You can sign up for a shift today until 5 PM on <a href=\"" + config.opt.full_url + "/?ref=lastcall\">the volunteering page</a>.</p><p style=\"font-size: 85%\"><br><a href=\"" + config.opt.full_url + "/unsubscribe?hmac=" + link + "&param=sendLastCall&id=" + results2[i].id + "\">Turn off last call emails</a> - <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=lastcall\">Configure email preferences</a></p>"
            };


            faultTolerantSend(function (err, info) {}, email, mailOpts, "Last call message ");

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


exports.newTemplate = function (email) {
  Template.findOne({}, null, {
    sort: {
      version: -1
    }
  }, function (err0, results0) {
    Template.find({
      version: results0.version
    }, null, {
      sort: {
        index: 1
      }
    }, function (err1, results1) {
      if (err1) {
        return console.log(err1);
      }

      // Set up the template table
      var nSpots, nVol, nExec, newUsers, colSpan, line, lines;
      lines = '<table><thead><tr><th style="text-align:left;padding-right: 1em;">Time</th><th style="text-align:left;padding-right: 1em;">Volunteers, Execs, New Volunteers</th></tr></thead><tbody>';
      for (i = 0; i < results1.length; i++) {
        nExec = results1[i].nExec;
        nSpots = results1[i].nSpots;
        newUsers = results1[i].newUsers;
        if (newUsers === true) {
          newUsersText = " <em>(new volunteers can sign up for this shift)</em>"
        } else {
          newUsersText = ""
        }
        line = '<tr><td style="text-align:left;padding-right: 1em;">' + results1[i].time + '</td><td><strong>' + (nSpots - nExec) + '</strong> volunteers, <strong>' + nExec + '</strong> execs' + newUsersText + '</td></tr>';
        lines += line;
      }
      lines += "</tbody></table>"

      User.find({
        isAdmin: true
      }, function (err, results) {
        if (err) {
          return console.log(err);
        }
        var i, mailOpts;
        for (i = 0; i < results.length; i++) {
          mailOpts = {
            from: '"' + email.name + '" <' + email.user + '>',
            to: '"' + results[i].userName.replace(/"/g, '') + '" <' + results[i].email + '>',
            subject: "New template for volunteering shifts",
            text: "Hi " + results[i].firstName + "!\nStarting next week the volunteering shifts will follow this format:\n" + lines + "\n\nYou can configure your email preferences on the volunteering website: " + config.opt.full_url + "/#emailPrefs",
            html: "<p>Hi " + results[i].firstName + "!</p><p>Starting next week the volunteering shifts will follow this format:</p>" + lines + "<p style=\"font-size: 80%\"><br>You can configure your email preferences on <a href=\"" + config.opt.full_url + "/#emailPrefs?ref=newtemplate\">the volunteering website</a>.</p>"
          };


          faultTolerantSend(function (err, info) {}, email, mailOpts, "New template message ");


        }
      });


    });
  });

};

// Function to send messages, and retry on errors
function faultTolerantSend(cb, email, mailOpts, messageDescription) {

  var operation = retry.operation({
    retries: 10,
    minTimeout: 5000,
    randomize: true
  });

  operation.attempt(function (currentAttempt) {
    transporter.sendMail(mailOpts, function (err, info) {
      if (operation.retry(err)) {
        console.log("Error for:", mailOpts.to, err);
        return;
      }

      cb(err ? operation.mainError() : null, info.response);
      console.log(messageDescription + 'sent to ' + info.envelope.to[0] + ': ' + info.response);
    });
  });
}
