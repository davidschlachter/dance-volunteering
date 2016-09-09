// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the Shift schema
var CancelledSchema = new mongoose.Schema({
  date: Date
});

// Export the Mongoose model
module.exports = mongoose.model('Cancelled', CancelledSchema);