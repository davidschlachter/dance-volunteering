
// Load required packages
var mongoose = require('mongoose');

// Define the todo schema
var userSchema = new mongoose.Schema({
	// UserIDs from OAuth
	facebookID: String,
	googleID: String,
	liveID: String,
	// Biographical
	name: String,
	email: String,
	emailConfirmed: { type: Boolean, default: false },
	isNew: { type: Boolean, default: true },
	isAdmin: { type: Boolean, default: false },
	// Email preferences
	sendReminder: { type: Boolean, default: true },
	sendThanks: { type: Boolean, default: true },
	sendVolunteeringCall: { type: Boolean, default: true },
	// Admin email preferences
	sendSchedule: { type: Boolean, default: true },
	sendDetails: { type: Boolean, default: false }
});

// Export the Mongoose model
module.exports = mongoose.model('User', userSchema);
