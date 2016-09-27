$(document).ready(function () {
  // If we had clicked 'Volunteer' and are now coming back from the login page, then volunteer for the shift we had clicked
  if (typeof user === "object" && getCookie("shiftID") != false) {
    var shiftID = getCookie("shiftID");
    document.cookie = "shiftID" + '=null; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path= /';
    var myForm = document.createElement("form");
    myForm.method = "post";
    myForm.action = "volunteer";
    p = {
      shiftID: shiftID
    };
    var k;
    for (k in p) {
      var myInput = document.createElement("input");
      myInput.setAttribute("name", k);
      myInput.setAttribute("value", p[k]);
      myForm.appendChild(myInput);
    }
    document.body.appendChild(myForm);
    myForm.submit();
    document.body.removeChild(myForm);
  }

  // Open the email preferences if we came here from an email link
  if (window.location.href.indexOf('#emailPrefs') != -1 && typeof user === "object") {
    $('#emailPrefs').modal('show');
  }

  // Node passes us the user's profile
  // If logged in, autofill the email preferences and show the admin tools if applicable
  // If not logged in, show the login button
  if (typeof user === "object") {
    if (typeof user === "object") {
      $("#drop3").html(user.userName + ' <span class="caret"></span>');
      $("#sendChangedShift").prop('checked', user.sendChangedShift);
      $("#sendDeletedShift").prop('checked', user.sendDeletedShift);
      $("#sendNewShift").prop('checked', user.sendNewShift);
      $("#sendReminder").prop('checked', user.sendReminder);
      $("#sendThanks").prop('checked', user.sendThanks);
      $("#sendVolunteeringCall").prop('checked', user.sendVolunteeringCall);
      $("#sendLastCall").prop('checked', user.sendLastCall);
      $("#sendSchedule").prop('checked', user.sendSchedule);
    }
  } else {
    $("#dropdown").html('<a class="btn btn-primary" style="color:white;" href="login">Log in</a>');
  }

  if (typeof user === "object" && user.isAdmin === true) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "javascripts/admin.js";
    head.appendChild(script);
  }

  // Fetch the volunteer shifts
  if (typeof shifts === "object" && shifts.cancelled != true) {
    displayShifts(shifts)
  } else {
    updateShifts();
  }

  // Set up the date picker for cancelling a week
  var picker = new Pikaday({
    field: $('#datepicker')[0],
    minDate: new Date(),
    disableDayFn: function (day) {
      if (moment(day).day() === 5) {
        return false;
      } else {
        return true;
      }
    }
  });
});

$(window).load(function () {
  if (shouldWrite() === false && getCookie("noShifts") === false) {
    if (moment().day() === 5 && moment().hour() < 21) {
      $("#noShiftsMessage").html("Shifts are closed for this week! Volunteering shifts for next Friday open on Sunday at 12 PM.<br><br>If you need to make a change to your shift, please contact <a href=\"mailto:osdsvol@gmail.com\">osdsvol@gmail.com</a>");
    }
    $('#noShifts').modal('show');
    document.cookie = "noShifts=shown";
  }
});

// Client-side version of the server's logic for whether shifts are open. If it's Friday evening, Saturday, or Sunday, disable the volunteering buttons.
function shouldWrite() {
  var now = moment();
  if (now.day() < 5 && now.day() > 0) { // Monday - Thursday: YES
    return true;
  } else if (now.day() === 5 && now.hour() < 17) { // Friday before 5 PM: YES
    return true;
  } else if (now.day() === 5 && now.hour() >= 17) { // Friday after 5 PM: NO
    return false;
  } else if (now.day() === 0 && now.hour() >= 12) { // Sunday after 12 PM: YES
    return true;
  } else if (now.day() === 0 && now.hour() < 12) { // Sunday before 12 PM: NO
    return false;
  } else if (now.day() === 6) { // Saturday: NO
    return false;
  } else {
    console.log("Could not interpret time in shouldWrite. Had now.day() = ", now.day(), "and now.hour() = ", now.hour());
    return false;
  }
}


// Function to delete one's own shift
function deleteMyShift() {
  $.ajax({
    url: "deleteMyShift",
    method: "POST"
  }).done(function (data) {
    updateShifts();
  });
};


// Function to fetch the latest volunteering shifts for this Friday
function updateShifts() {
  $.ajax({
    url: "getShifts",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function (data) {
    if (data.cancelled) {
      weekCancelled();
    } else {
      displayShifts(data);
    }
  });
};


// (Ugly) function to display the volunteering shifts
function displayShifts(data) {
  $("#shifts").find("tr:gt(0)").remove();
  var g, h, i, line, lines, colSpanText, userName, profilePicture, tableText, deleteButton;

  // Determine the number of columns
  var nCol = 0;
  for (i = 0; i < data.length; i++) {
    if (data[i].nVol + data[i].nExec > nCol) {
      nCol = data[i].nVol + data[i].nExec;
    }
  }
  $("#volCol").attr('colspan', nCol);

  // Are shifts open?
  var areOpen = shouldWrite(),
    action;
  if (areOpen) {
    action = 'type="submit"';
    delAction = ''
  } else {
    action = 'disabled type="button"';
    delAction = 'disabled'
  }

  // Set up the volunteering table
  var nSpots, nVol, nExec, colSpan, newUserText;
  for (i = 0; i < data.length; i++) {
    nVol = data[i].nVol;
    nExec = data[i].nExec;
    nSpots = nVol + nExec;
    colSpan = nCol - nSpots;
    line = '<tr><td>' + data[i].time + '</td>';
    for (h = 0; h < nVol; h++) {
      if (h === 0 && colSpan !== 0) {
        colSpanText = ' colspan = "' + (colSpan + 1) + '"';
      } else {
        colSpanText = "";
      }
      if (data[i].Vol[h] !== null && typeof data[i].Vol[h] === 'object') {
        userName = data[i].Vol[h].firstName + " " + data[i].Vol[h].lastNameInitial;
        profilePicture = data[i].Vol[h].profilePicture;
        if (typeof user === 'object' && user._id.toString() === data[i].Vol[h]._id.toString()) {
          deleteButton = '<input type="button" value="✘" ' + delAction + ' onclick="deleteMyShift()" class="btn btn-danger btn-xs" />';
        } else if (typeof user === 'object' && user.isAdmin === true) {
          deleteButton = '<span class="otherDel"><input type="button" value="✘" ' + delAction + ' onclick=\'deleteAnyShift("' + data[i]._id + '", "' + data[i].Vol[h]._id + '")\' class="btn btn-danger btn-xs" /></span>';
        } else {
          deleteButton = ""
        }
        tableText = '<img class="user" src="' + profilePicture + '" /> ' + userName + ' ' + deleteButton;
      } else {
        deleteButton = "";
        if (areOpen && typeof user === 'object' && user.isNewUser === false) {
          action = 'type="submit"';
        } else if (areOpen && typeof user === 'object' && user.isNewUser === true && data[i].newUsers === true) {
          action = 'type="submit"';
        } else if (areOpen && typeof user === 'object' && user.isNewUser === true && data[i].newUsers === false) {
          action = 'disabled type="button"';
        }
        tableText = '<form action="volunteer" method="post"><input type="text" name="shiftID" class="shiftID" value="' + data[i]._id + '"><input ' + action + ' value="Volunteer" class="btn btn-primary" /></form>';
      }
      line += '<td' + colSpanText + '>' + tableText + '</td>';
    }
    var execClass;
    var action2;
    if (typeof user === "object" && user.isAdmin === true && shouldWrite()) {
      execClass = "btn btn-primary";
      action2 = 'type="submit"';
    } else {
      execClass = "btn btn-default";
      action2 = 'disabled type="button"';
    }
    for (h = 0; h < nExec; h++) {
      if (data[i].Exec[h] !== null && typeof data[i].Exec[h] === 'object') {
        if (typeof user === 'object' && user._id.toString() === data[i].Exec[h]._id.toString()) {
          deleteButton = '<input type="button" value="✘" ' + delAction + ' onclick=\'deleteAnyShift("' + data[i]._id + '", "' + data[i].Exec[h]._id + '")\' class="btn btn-danger btn-xs" />';
        } else if (typeof user === 'object' && user.isAdmin === true) {
          deleteButton = '<span class="otherDel"><input type="button" value="✘" ' + delAction + ' onclick=\'deleteAnyShift("' + data[i]._id + '", "' + data[i].Exec[h]._id + '")\' class="btn btn-danger btn-xs" /></span>';
        } else {
          deleteButton = ""
        }
        userName = data[i].Exec[h].firstName + " " + data[i].Exec[h].lastNameInitial;
        profilePicture = data[i].Exec[h].profilePicture;
        tableText = '<img class="user" src="' + profilePicture + '" /> ' + userName + ' ' + deleteButton;
      } else {
        tableText = '<form action="volunteerExec" method="post"><input type="text" name="shiftID" class="shiftID" value="' + data[i]._id + '"><input ' + action2 + ' value="Exec" class="' + execClass + '" /></form>'
      }
      line += '<td>' + tableText + '</td>';
    }
    line += "</tr>"
    lines += line;
  }
  $("#shifts").append(lines);
  // Make sure that we actually select the Friday for time zones west of EST
  var thisFriday;
  if (moment(data[0].date).weekday() != 5) {
    thisFriday = moment(data[0].date).weekday(5);
  } else {
    thisFriday = moment(data[0].date);
  }
  $("#date").html("Volunteering shifts for <strong>" + thisFriday.format("dddd MMMM D, YYYY") + '</strong>:');
  $("#friday").text(thisFriday.format("dddd MMMM D, YYYY"));
};


var weekCancelled = function () {
  $("#shifts").hide();
  $("#date").html('There will be no dance this Friday! Thank you for helping out and see you next week!');
  $("#date").addClass('well-lg');
  $("#date").css('padding', '6em;');
  if (shouldWrite() == false && moment().day() != 5) {
    $("#date").html('There was no dance last Friday! Thank you for helping out and see you next week!');
  }
};


// Function to get a cookie
var getCookie = function (name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts.pop().split(";").shift();
  } else {
    return false;
  }
};