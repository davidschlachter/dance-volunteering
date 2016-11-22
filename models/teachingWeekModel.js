// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the teachingWeek model
var teachingWeek = new mongoose.Schema({
  date: Date, // The date
  intermediateTeachers: [{ // An array of teachers 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  intermediateTopic: String, // The topic of the intermediate lesson
  beginnerTeachers: [{ // An array of teachers 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Export the Mongoose model
module.exports = mongoose.model('TeachingWeek', teachingWeek);