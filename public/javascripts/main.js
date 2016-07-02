
$(document).ready(function() {
  // If we had clicked 'Volunteer' and are now coming back from the login page, then volunteer for the shift we had clicked
  if (typeof user === "object" && getCookie("shiftID") != false) {
    var shiftID = getCookie("shiftID");
    document.cookie = "shiftID" +'=null; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path= /';
    var myForm=document.createElement("form");
    myForm.method="post";
    myForm.action="volunteer";
    p = {shiftID: shiftID};
    var k;
    for(k in p) {
      var myInput=document.createElement("input"); myInput.setAttribute("name",k);
      myInput.setAttribute("value",p[k]);
      myForm.appendChild(myInput);
    }
    document.body.appendChild(myForm);
    myForm.submit();
    document.body.removeChild(myForm);
  }
  
  // Node passes us the userID, but we'll fetch the user's full profile (for email preferences and admin status)
  // If logged in, autofill the email preferences and show the admin tools if applicable
  // If not logged in, show the login button
  if (typeof user === "object") {
    $.ajax({
      url: "getUser",
      cache: false,
      dataType: "json",
      method: "GET"
    }).done(function(data) {
      user = data;
      if (typeof user === "object") {
        $("#drop3").html(user.userName + ' <span class="caret"></span>');
        $("#sendChangedShift").prop('checked', user.sendChangedShift);
        $("#sendDeletedShift").prop('checked', user.sendDeletedShift);
        $("#sendNewShift").prop('checked', user.sendNewShift);
        $("#sendReminder").prop('checked', user.sendReminder);
        $("#sendThanks").prop('checked', user.sendThanks);
        $("#sendVolunteeringCall").prop('checked', user.sendVolunteeringCall);
        $("#sendSchedule").prop('checked', user.sendSchedule);
        $("#sendDetails").prop('checked', user.sendDetails);
      }
    });
  } else {
    $("#drop3").html('<a style="color:white;" href="login">Log in</a>');
    $("#drop3").removeClass("dropdown-toggle");
    $("#drop3").removeAttr("data-toggle");
  }
  
  if (typeof user === "object" && user.isAdmin === true) {
    $("#adminTools").show();
    $("#adminEmail").show();
  }
  
  // Fetch the volunteer shifts
  if (typeof shifts === "object") {
    displayShifts(shifts)
  } else {
    updateShifts();
  }
});

$(window).load(function(){
  if (shouldWrite() === false && getCookie("noShifts") === false)
    $('#noShifts').modal('show');
    document.cookie = "noShifts=shown";
});


// Client-side version of the server's logic for whether shifts are open. If it's Friday evening, Saturday, or Sunday, disable the volunteering buttons.
function shouldWrite() {
  var now = moment();
  if (now.day() < 5 && now.day() > 0) {
    return true;
  } else if (now.day() === 5 && now.hour() < 17) {
    return true;
  } else if (now.day() === 5 && now.hour() >= 17) {
    return false;
  } else if (now.day() === 6 || now.day() === 0) {
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
  }).done(function(data) {
    updateShifts();
  });
};


// For admins, show the buttons to delete other users' shifts after clicking the button for this
function showDelButtons() {
  $(".otherDel").toggle();
  $("#otherDel1").toggle();
  $("#otherDel2").toggle();
};


// For admins, function to delete any shift
function deleteAnyShift(shiftID, volID) {
  $.ajax({
    url: "deleteAnyShift",
    data: {
      shiftID: shiftID,
      volID: volID
    },
    method: "POST"
  }).done(function(data) {
    updateShifts();
  });
};

// For admins, function to show details (last names and email addresses) for this Friday's volunteers
function showDetails() {
  $.ajax({
    url: "getDetails",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
    $("#userDetails").find("tr:gt(0)").remove();
    var i, j, line, lines = "";
    for (i=0; i < data.length; i++) {
      for (j = 0; j < data[i].Vol.length; j++) {
        line = '<tr><td>' + data[i].time + '</td><td>' + data[i].Vol[j].firstName + ' ' + data[i].Vol[j].lastName + '</td><td>' + data[i].Vol[j].email + '</td></tr>';
        lines += line;
      }
    }
    $("#userDetails").append(lines);
    $("#userDetails").toggle();
    $("#details1").toggle();
    $("#details2").toggle();
  });
};

// For admins, function to show all admins
function showAdmins() {
  $.ajax({
    url: "getAdmins",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
    $("#adminDetails").find("tr:gt(0)").remove();
    var i, line, lines = "";
    for (i=0; i < data.length; i++) {
      line = '<tr><td>' + data[i].firstName + ' ' + data[i].lastName + '</td><td>' + data[i].email + '</td></tr>';
      lines += line;
    }
    $("#adminDetails").append(lines);
    $("#adminDetails").toggle();
    $("#execs1").toggle();
    $("#execs2").toggle();
  });
};


// Function to fetch the latest volunteering shifts for this Friday
function updateShifts() {
  $.ajax({
    url: "getShifts",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
    displayShifts(data);
  });
};


// (Ugly) function to display the volunteering shifts
function displayShifts(data) {
  $("#shifts").find("tr:gt(0)").remove();
  var g, h, i, line, lines, colSpanText, userName, profilePicture, tableText, deleteButton;
  
  // Determine the number of columns
  var nCol = 0;
  for (i=0; i < data.length; i++) {
    if (data[i].nVol + data[i].nExec > nCol) {
      nCol = data[i].nVol + data[i].nExec;
    }
  }
  $("#volCol").attr('colspan',nCol);

  // Are shifts open?
  var areOpen = shouldWrite(), action;
  if (areOpen) {
    action = 'type="submit"';
    delAction = ''
  } else {
    action = 'disabled type="button"';
    delAction = 'disabled'
  }
  
  // Set up the volunteering table
  var nSpots, nVol, nExec, colSpan;
  for (i=0; i < data.length; i++) {
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
        tableText = '<form action="volunteer" method="post"><input type="text" name="shiftID" class="shiftID" value="'+data[i]._id+'"><input ' + action + ' value="Volunteer" class="btn btn-primary" /></form>';
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
        tableText = '<form action="volunteerExec" method="post"><input type="text" name="shiftID" class="shiftID" value="'+data[i]._id+'"><input ' + action2 + ' value="Exec" class="' + execClass + '" /></form>'
      }
      line += '<td>' + tableText + '</td>';
    }
    line+= "</tr>"
    lines += line;
  }
  $("#shifts").append(lines);
  $("#date").html("Volunteering shifts for <strong>" + moment(data[0].date).format("dddd MMMM D, YYYY") + '</strong>:');
};


// Function to get a cookie
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts.pop().split(";").shift();} else {return false;}
};