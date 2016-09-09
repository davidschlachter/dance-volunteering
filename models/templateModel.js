// Load required packages
var mongoose = require('mongoose');

// Define the Template schema
var TemplateSchema = new mongoose.Schema({
  index: {
    type: Number,
    min: 0
  },
  time: String,
  nSpots: { // The total number of volunteers for the shift (including exec)
    type: Number,
    min: 1
  },
  nExec: { // The number of execs for the shift
    type: Number,
    min: 0
  },
  newUsers: { // Whether new users can sign up for the shift
    type: Boolean,
    default: true
  },
  version: Number,
  author: String
});

// Export the Mongoose model
module.exports = mongoose.model('Template', TemplateSchema);