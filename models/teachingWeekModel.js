// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the teachingWeek model
var teachingWeek = new mongoose.Schema({
  date: Date, // The date
  time: String,
  type: String,
  teachers: [{ // An array of teachers 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  topic: String
});

// Export the Mongoose model
module.exports = mongoose.model('TeachingWeek', teachingWeek);
