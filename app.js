var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LiveStrategy = require('passport-windowslive').Strategy;
var User = require('./models/userModel');
var flash = require('connect-flash');
var email = require('./controllers/email');

var routes = require('./routes/index');

var app = express();

// Get options from config file
var config = require('./config');

// Connect to the database
mongoose.connect(config.opt.db, config.opt.mongoose);
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

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.opt.sessionsecret));
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: config.opt.sessionsecret,
	cookie: {maxAge: 86400 * 180 * 1000}, // Session cookie lasts six months
	store: new MongoStore({
		mongooseConnection: db,
		touchAfter: 8 * 3600 // Don't update session entry more than once in 8 hrs
	}),
	resave: false, // Don't save session if unmodified
	saveUninitialized: false // Don't create session until something stored
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
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
      if (err) {return console.log(err);}
      if (!err && user != null) {
         // Update the user if necessary
        User.update({facebookID: profile.id}, {$set:{userName: profile.displayName, firstName: profile.name.givenName, lastName: profile.name.familyName, lastNameInitial: profile.name.familyName.charAt(0) + '.', profilePicture: profile.photos[0].value, email: profile.emails[0].value}});
        done(null, user);
      } else {
        var user = new User({
          facebookID: profile.id,
          userName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          lastNameInitial: profile.name.familyName.charAt(0) + '.',
          profilePicture: profile.photos[0].value,
          email: profile.emails[0].value
        });
        user.save(function (err) {
          if (err) {return console.log(err);} else {
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
      if (err) {return console.log(err);}
      if (!err && user != null) {
        // Update the user if necessary
        User.update({googleID: profile.id}, {$set:{userName: profile.displayName, firstName: profile.name.givenName, lastName: profile.name.familyName, lastNameInitial: profile.name.familyName.charAt(0) + '.', profilePicture: profile.photos[0].value, email: profile.emails[0].value}});
        done(null, user);
      } else {
        var user = new User({
          googleID: profile.id,
          userName: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          lastNameInitial: profile.name.familyName.charAt(0) + '.',
          profilePicture: profile.photos[0].value,
          email: profile.emails[0].value
        });
        user.save(function (err) {
          if (err) {return console.log(err);} else {
            console.log("Added new user", profile.displayName);
            email.welcome(user, config.opt.email);
            done(null, user);
          };
        });
      };
    });
  }
));

// Serialize and deserialize
passport.serializeUser(function (user, done) {
	done(null, user);
});
passport.deserializeUser(function (obj, done) {
	done(null, obj);
});


module.exports = app;
