// Javascript for teacher functions

$(document).ready(function () {
  // Add event listeners for the pill buttons
  $('#teachingPill').on('click', switchToDoorShifts);
  $('#doorShiftsPill').on('click', switchToTeaching);
  
  getTeachingWeeks();
  
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

// Get the current teachingWeeks
function getTeachingWeeks() {
  $.ajax({
    url: "getTeachingWeeks",
    method: "GET",
    cache: false
  }).done(function (data) {
    console.log(data);
    if ($("#teachingDiv").html() === '') {
      displayAll(data);
    } else {
      // Update only one teachingWeek, rather than all of them!
    }
  });
};

// Function to display all the teachingWeeks
function displayAll(teachingWeeks) {
  var i, j;
  var line, lines = "";
  
  for (i = 0; i < teachingWeeks.length; i++) {
    line = '<div class="teachingWeek" id="teachingWeek' + teachingWeeks[i]._id + '"><h3>'+moment(teachingWeeks[i].date).format("dddd MMMM D, YYYY")+'</h3><h4>7:30 – 8:30 Intermediate Lesson</h4><p>'
    for (j = 0; j < teachingWeeks[i].intermediateTeachers.length; j++) {
      line += teachingWeeks[i].intermediateTeachers[j].firstName + ' ' + teachingWeeks[i].intermediateTeachers[j].lastName + ' ';
    }
    line += '<strong>' + teachingWeeks[i].intermediateTopic + '</strong></p><h4>8:30 – 9:30 Beginner Lesson</h4><p>'
    for (j = 0; j < teachingWeeks[i].beginnerTeachers.length; j++) {
      line += teachingWeeks[i].beginnerTeachers[j].firstName + ' ' + teachingWeeks[i].beginnerTeachers[j].lastName + ' ';
    }
    line += '</p></div>';
    lines += line;
  }
  
  $("#teachingDiv").html(lines);
};

// Update/create a teachingWeek
// For testing right now!
function newTeachingWeek() {
  var date = new Date();
  date.setDate(date.getDate() + 17);
  
  // Some static values for now
  var teachingWeek = {
    date: date,
    intermediateTeachers: ["580cbb23cf461f295674e432"],
    intermediateTopic: "The Big Apple",
    beginnerTeachers: ["580cbb23cf461f295674e432"],
    _csrf: csrf
  }
  
  $.ajax({
    url: "newTeachingWeek",
    method: "POST",
    dataType: "JSON",
    data: teachingWeek
  }).done(function (data) {
    getTeachingWeeks();
  });
};

