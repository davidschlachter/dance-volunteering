// Load required packages
var mongoose = require('mongoose');

// Define the todo schema
var userSchema = new mongoose.Schema({
  // UserIDs from OAuth
  facebookID: String,
  googleID: String,
  // Biographical
  userName: String,
  firstName: String,
  lastName: String,
  lastNameInitial: String,
  profilePicture: String,
  email: String,
  emailConfirmed: {
    type: Boolean,
    default: false
  },
  isNewUser: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  // Email preferences
  sendNewShift: {
    type: Boolean,
    default: true
  },
  sendChangedShift: {
    type: Boolean,
    default: true
  },
  sendDeletedShift: {
    type: Boolean,
    default: true
  },
  sendReminder: {
    type: Boolean,
    default: true
  },
  sendThanks: {
    type: Boolean,
    default: false
  },
  sendVolunteeringCall: {
    type: Boolean,
    default: true
  },
  sendLastCall: {
    type: Boolean,
    default: true
  },
  // Admin email preferences
  sendSchedule: {
    type: Boolean,
    default: true
  },
  // Update user details automatically?
  autoUpdateDetails: {
    type: Boolean,
    default: true
  }
});

// Export the Mongoose model
module.exports = mongoose.model('User', userSchema);