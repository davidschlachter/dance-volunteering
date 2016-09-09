// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./userModel');

// Define the Shift schema
var ShiftSchema = new mongoose.Schema({
  date: Date,
  index: {
    type: Number,
    min: 0
  },
  time: String,
  nVol: Number,
  Vol: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }], // userIDs of non-exec volunteers for shift
  nExec: Number,
  Exec: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }], // userIDs of execs for shift
  newUsers: Boolean
});

// Export the Mongoose model
module.exports = mongoose.model('Shift', ShiftSchema);