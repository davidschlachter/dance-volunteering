// Javascript for teacher functions

$(document).ready(function () {
  // Event listeners for the pill buttons
  $('#teachingPill').on('click', switchToDoorShifts);
  $('#doorShiftsPill').on('click', switchToTeaching);
});

function switchToDoorShifts() {
  $("#teachingDiv").show();
  $("#teachingPill").addClass('active');
  $("#doorShiftsDiv").hide();
  $("#doorShiftsPill").removeClass('active');
}

function switchToTeaching() {
  $("#doorShiftsDiv").show();
  $("#doorShiftsPill").addClass('active');
  $("#teachingDiv").hide();
  $("#teachingPill").removeClass('active');
}
