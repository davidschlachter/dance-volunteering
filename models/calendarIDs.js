// Load required packages
var mongoose = require('mongoose');

// Define the Template schema
var CalendarIDsSchema = new mongoose.Schema({
  userID: String,
  shiftID: String,
  calID: String,
  sequenceNumber: Number
});

// Export the Mongoose model
module.exports = mongoose.model('calendarID', CalendarIDsSchema);