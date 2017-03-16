// Load required packages
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Define the Teaching template schema
var TeachingTemplateSchema = new mongoose.Schema({
  index: {
    type: Number,
    min: 0
  },
  type: String,
  time: String,
  hasTitle: Boolean,
  version: Number,
  author: String
});

// Export the Mongoose model
module.exports = mongoose.model('TeachingTemplate', TeachingTemplateSchema);