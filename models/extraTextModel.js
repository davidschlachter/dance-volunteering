// Load required packages
const mongoose = require('mongoose');

// Define the Template schema
var ExtraTextSchema = new mongoose.Schema({
  text: String,
  version: {
    type: Number,
    min: 0
  },
  author: String
});

// Export the Mongoose model
module.exports = mongoose.model('extraText', ExtraTextSchema);