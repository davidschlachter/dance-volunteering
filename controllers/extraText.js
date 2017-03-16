var extraText = require('../models/extraTextModel');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

// Get options from config file
var config = require('../config');

// Return the current extraText
exports.getextraText = function (req, res, next) {
  extraText.findOne({}, null, {
    sort: {
      version: -1
    }
  }, function (err0, results0) {
    if (err0) {
      return console.log(err0);
    }
    if (!results0) {
      return console.log("No extra text was found.");
    }
    res.json(results0);
  });
};

// Set a new extraText
exports.setextraText = function (req, res, next) {
  extraText.findOne({}, null, {
    sort: {
      version: -1
    }
  }, function (err0, results0) {
    if (typeof req.body.extraText === 'undefined' || req.body.extraText.length === 0 || typeof req.body.extraText !== 'string') {
      return console.log("extraText was undefined, had zero length, or was not a string. req.body: ", req.body);
    }
    var thisextraText;
    if (!results0) {
      version = 0;
    } else {
      version = results0.version + 1;
    }
    thisextraText = entities.encode(req.body.extraText.trim()).replace(/\n/g, "<br>");

    var thisExtraText = new extraText({
      text: thisextraText,
      version: version,
      author: req.user._id
    });
    thisExtraText.save(function (err1, results1) {
      if (err1) {
        return console.log(err1);
      }
      res.json("Successfully set extra text");
    });
  });
};