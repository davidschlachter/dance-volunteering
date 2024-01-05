const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const FacebookStrategy = require('passport-facebook').Strategy;
const MagicLoginStrategy = require('passport-magic-login').Strategy;
const GoogleStrategy = require('@passport-next/passport-google-oauth2').Strategy;
const User = require('./models/userModel');
const email = require('./controllers/email');
const userController = require('./controllers/user');
const shiftController = require('./controllers/shift');
const cron = require('node-cron');
const helmet = require('helmet');
const Entities = require('html-entities').Html5Entities;
var entities = new Entities();
const validator = require('validator');
const uuid = require('uuid');
const minify = require('express-minify');
const compression = require('compression')

const routes = require('./routes/index');

var app = express();

// Get options from config file
const config = require('./config');

// Connect to the database
mongoose.connect(config.opt.db, config.opt.mongoose);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', function (err) {
  console.log('Connection error to MongoDB database ', err);
});
db.once('open', function () {
  console.log('Connected to the MongoDB database.');
});

// Use Jade for templating
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser(config.opt.sessionsecret));
app.use(compression());
app.use(minify({
  cache: path.join(__dirname, 'cache')
}));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '14d'
}));
app.set('trust proxy', 1);
app.use(session({
  proxy: true,
  secret: config.opt.sessionsecret,
  cookie: {
    maxAge: 86400 * 180 * 1000, // Session cookie lasts six months
    secure: true,
    httpOnly: true,
    path: '/'
  },
  store: new MongoStore({
    mongooseConnection: db,
    touchAfter: 8 * 3600 // Don't update session entry more than once in 8 hrs
  }),
  resave: false, // Don't save session if unmodified
  saveUninitialized: false // Don't create session until something stored
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(helmet({
  hsts: false
}));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    childSrc: ["'none'"],
    connectSrc: ["'self'"],
    fontSrc: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    imgSrc: ['data:', '*'],
    mediaSrc: ["'none'"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'", function (req, res) {
      if (typeof res !== "undefined" && typeof res.locals !== "undefined") {
        res.locals.nonce = uuid.v4();
        return "'nonce-" + res.locals.nonce + "'";
      } else {
        return null;
      }
    }],
    styleSrc: ["'self'"],
    //  sandbox: ['allow-forms', 'allow-scripts'],
    //  reportUri: config.opt.base_url + '/csp_reports'
  },
  reportOnly: false,
  setAllHeaders: false,
  disableAndroid: false,
  browserSniff: true
}));
app.use(helmet.referrerPolicy({
  policy: 'same-origin'
}));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Passport login strategies
//
passport.use(new FacebookStrategy({
  clientID: config.opt.facebook.clientID,
  clientSecret: config.opt.facebook.clientSecret,
  callbackURL: config.opt.facebook.callbackURL,
  enableProof: true,
  passReqToCallback: true,
  profileFields: ['emails', 'name', 'picture', 'displayName']
},
  function (req, accessToken, refreshToken, profile, done) {
    User.findOne({
      facebookID: profile.id
    }, function (err, user) {
      if (err) {
        return console.log(err);
      }
      if (!err && user != null) {
        // Quit if the email is invalid
        if (!validator.isEmail(profile.emails[0].value)) {
          return console.log("Email address invalid: ", profile.emails[0].value);
        }
        // Update the user if necessary
        if (user.autoUpdateDetails) {
          User.update({
            facebookID: profile.id
          }, {
            $set: {
              userName: entities.encode(profile.displayName),
              firstName: entities.encode(profile.name.givenName),
              lastName: entities.encode(profile.name.familyName),
              lastNameInitial: entities.encode(profile.name.familyName).charAt(0) + '.',
              profilePicture: encodeURI('https://graph.facebook.com/' + profile.id + '/picture'),
              email: profile.emails[0].value
            }
          }, function (err, doc) {
            if (err) {
              return console.log(err);
            } else {
              console.log("Updated user");
              done(null, user);
            }
          });
        } else {
          User.update({
            facebookID: profile.id
          }, {
            $set: {
              profilePicture: encodeURI('https://graph.facebook.com/' + profile.id + '/picture')
            }
          }, function (err, doc) {
            if (err) {
              return console.log(err);
            } else {
              console.log("Updated user");
              done(null, user);
            }
          });
        }
      } else {
        // Quit if the email is invalid
        if (!validator.isEmail(profile.emails[0].value)) {
          return console.log("Email address invalid: ", profile.emails[0].value);
        }
        var user = new User({
          facebookID: profile.id,
          userName: entities.encode(profile.displayName),
          firstName: entities.encode(profile.name.givenName),
          lastName: entities.encode(profile.name.familyName),
          lastNameInitial: entities.encode(profile.name.familyName).charAt(0) + '.',
          profilePicture: encodeURI('https://graph.facebook.com/' + profile.id + '/picture'),
          email: profile.emails[0].value
        });
        user.save(function (err) {
          if (err) {
            return console.log(err);
          } else {
            console.log("Added new user", profile.displayName);
            email.welcome(user, config.opt.email);
            done(null, user);
          };
        });
      };
    });
  }
));
passport.use(new GoogleStrategy({
  clientID: config.opt.google.clientID,
  clientSecret: config.opt.google.clientSecret,
  callbackURL: config.opt.google.callbackURL
},
  function (accessToken, refreshToken, profile, done) {
    User.findOne({
      googleID: profile.id
    }, function (err, user) {
      if (err) {
        return console.log(err);
      }
      if (!err && user != null) {
        // Quit if the email is invalid
        if (!validator.isEmail(profile.emails[0].value)) {
          return console.log("Email address invalid: ", profile.emails[0].value);
        }
        // Update the user if necessary
        if (user.autoUpdateDetails) {
          User.update({
            googleID: profile.id
          }, {
            $set: {
              userName: entities.encode(profile.displayName),
              firstName: entities.encode(profile.name.givenName),
              lastName: entities.encode(profile.name.familyName),
              lastNameInitial: entities.encode(profile.name.familyName).charAt(0) + '.',
              profilePicture: encodeURI(profile.photos[0].value),
              email: profile.emails[0].value
            }
          }, function (err, doc) {
            if (err) {
              return console.log(err);
            } else {
              console.log("Updated user");
              done(null, user);
            }
          });
        } else {
          User.update({
            googleID: profile.id
          }, {
            $set: {
              profilePicture: encodeURI(profile.photos[0].value)
            }
          }, function (err, doc) {
            if (err) {
              return console.log(err);
            } else {
              console.log("Updated user");
              done(null, user);
            }
          });
        }
      } else {
        // Quit if the email is invalid
        if (!validator.isEmail(profile.emails[0].value)) {
          return console.log("Email address invalid: ", profile.emails[0].value);
        }
        var user = new User({
          googleID: profile.id,
          userName: entities.encode(profile.displayName),
          firstName: entities.encode(profile.name.givenName),
          lastName: entities.encode(profile.name.familyName),
          lastNameInitial: entities.encode(profile.name.familyName).charAt(0) + '.',
          profilePicture: encodeURI(profile.photos[0].value),
          email: profile.emails[0].value
        });
        user.save(function (err) {
          if (err) {
            return console.log(err);
          } else {
            console.log("Added new user", profile.displayName);
            email.welcome(user, config.opt.email);
            done(null, user);
          };
        });
      };
    });
  }
));

passport.use(new MagicLoginStrategy({
  secret: config.opt.sessionsecret,
  callbackUrl: "/auth/email/callback",
  sendMagicLink: async (destination, href) => {
    await sendEmail({ // TODO put the real function here!
      to: destination,
      body: `Click this link to finish logging in: ${config.opt.full_url}${href}`
    })
  },

  // Once the user clicks on the magic link and verifies their login attempt,
  // you have to match their email to a user record in the database.
  // If it doesn't exist yet they are trying to sign up so you have to create a new one.
  // "payload" contains { "destination": "email" }
  // In standard passport fashion, call callback with the error as the first argument (if there was one)
  // and the user data as the second argument!
  verify: (payload, done) => {
    // Get or create a user with the provided email from the database

    User.findOne({
      email: payload.destination
    }, function (err, user) {
      if (err) {
        return console.log(err);
      }
      if (!err && user != null) {
        done(null, user)
      } else { return console.log(`No user exists for ${payload.destination}`) }
    })
  }
}))

//
// Scheduled tasks
//

// Saturday 11 PM -- update isNewUser flags
cron.schedule('0 23 * * 6', function () {
  console.log('Updating isNewUser');
  userController.updateNewUsers();
});
cron.schedule('5 23 * * 6', function () {
  console.log('Tidying email list');
  userController.tidyEmailList();
});
// Sunday 12 PM -- create shifts, notify users
cron.schedule('1 0 12 * * 7', function () {
  console.log("Running checkShifts from cron");
  shiftController.checkShifts();
});
cron.schedule('15 0 12 * * 7', function () {
  console.log('Sending out volunteering call');
  email.shiftsAvailable(config.opt.email);
});

// Thursday 6 PM -- send reminders to volunteers with a shift
cron.schedule('0 18 * * 4', function () {
  console.log('Sending out reminders');
  email.reminderVol(config.opt.email);
});

// Friday 9 AM -- send last call if any shifts are still available
cron.schedule('0 9 * * 5', function () {
  console.log('Sending out last call');
  email.lastCall(config.opt.email);
});

// Friday 5 PM -- send final volunteering schedule to each Exec
cron.schedule('0 17 * * 5', function () {
  console.log('Sending schedule out');
  email.mailOut(config.opt.email);
});


// Serialize and deserialize
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


module.exports = app;