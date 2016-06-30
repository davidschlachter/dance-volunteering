
$(document).ready(function() {
  if (typeof user === "object" && getCookie("shiftID") != false) {
    var shiftID = getCookie("shiftID");
    document.cookie = "shiftID" +'=null; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path= /';
    var myForm=document.createElement("form");
    myForm.method="post",myForm.action="volunteer";
    p = {shiftID: shiftID};
    for(var k in p){var myInput=document.createElement("input"); myInput.setAttribute("name",k),myInput.setAttribute("value",p[k]),myForm.appendChild(myInput)}document.body.appendChild(myForm),myForm.submit(),document.body.removeChild(myForm);
  }
    if (typeof user === "object") {
      $("#user").html("Welcome " + user.userName + '! <a href="logout">(Log out)</a>');
    }
  updateShifts();
});

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

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) {return parts.pop().split(";").shift();} else {return false}
};

function deleteMyShift() { 
  $.ajax({
    url: "deleteMyShift",
    method: "POST"
  }).done(function(data) {
    updateShifts();
  });
};

function updateShifts() {
  $.ajax({
    url: "getShifts",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
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
    var areOpen = shouldWrite();
    
    // Set up the volunteering table
    var nSpots, nVol, nExec, colSpan, action;
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
          if (typeof user === 'object' && user._id.toString() === data[i].Vol[h]._id.toString()) {deleteButton = '<input type="button" value="✘" onclick="deleteMyShift()" class="btn btn-danger btn-xs" />';} else {deleteButton = ""}
          tableText = '<img class="user" src="' + profilePicture + '" /> ' + userName + ' ' + deleteButton;
        } else {
          deleteButton = "";
          if (areOpen) {
            action = 'type="submit"';
          } else {
            action = 'disabled type="button"';
          }
          tableText = '<form action="volunteer" method="post"><input type="text" name="shiftID" class="shiftID" value="'+data[i]._id+'"><input ' + action + ' value="Volunteer" class="btn btn-primary" /></form>'
        }
        line += '<td' + colSpanText + '>' + tableText + '</td>';
      }
      for (h = 0; h < nExec; h++) {
        if (data[i].Exec[h] !== null && typeof data[i].Exec[h] === 'object') {
          userName = data[i].Exec[h].firstName + " " + data[i].Exec[h].lastNameInitial;
          profilePicture = data[i].Exec[h].profilePicture;
          tableText = '<img class="user" src="' + profilePicture + '" /> ' + userName;
        } else {
          tableText = "<a href='#' class='btn btn-primary'>Exec</a>"
        }
        line += '<td>' + tableText + '</td>';
      }
      line+= "</tr>"
      lines += line;
    }
    $("#shifts").append(lines);
    $("#date").html("Volunteering shifts for <strong>" + moment(data[0].date).format("dddd MMMM D, YYYY") + '</strong>:');
  });
};
