
// Load required packages
var mongoose = require('mongoose');

// Define the Shift schema
var ShiftSchema = new mongoose.Schema({
	date: Date,
	index: {
		type: Number,
		min: 0
	},
	time: String,
	Vol: [Number],  // userIDs of non-exec volunteers for shift
	Exec: [Number]  // userIDs of execs for shift
});

// Export the Mongoose model
module.exports = mongoose.model('Shift', ShiftSchema);
