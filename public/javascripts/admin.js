
// For admins, show the buttons to delete other users' shifts after clicking the button for this
function showDelButtons() {
  $(".otherDel").toggle();
  $("#otherDel1").toggle();
  $("#otherDel2").toggle();
};


// For admins, show the interface to cancel a week
function showCancel() {
  $("#cancelWeeks").toggle();
  $("#cancel1").toggle();
  $("#cancel2").toggle();
 
  getCancelled();
 
  $("#cancelButton").on("click", function(e) {
    cancelWeek($("#datepicker").val());
  });
};

function cancelWeek (week) {
  if (typeof week === "undefined" || week === "") {
    return (console.log("No week selected"));
  } else {
    $.ajax({
      url: "cancelWeek",
      data: {week: week},
      method: "POST"
    }).done(function(data) {
      getCancelled();
    });
  }
};

function unCancelWeek (id) {
  $.ajax({url: "unCancelWeek", method: "POST", data: {weekID: id}}).done(function(data) {
    getCancelled();
  });
};

function getCancelled () {
  $("#cancelledWeeks").find("tr:gt(0)").remove();
  $.ajax({url: "getCancelled", method: "GET", cache:false}).done(function(data) {
    var i, tbody = "<tbody>";
    if (data.length === 0) {tbody+="<tr><td>No cancelled weeks</td></tr></tbody>"; $("#cancelledWeeks").append(tbody); return;} 
    for (i=0; i<data.length; i++) {
      tbody += '<tr><td>' + moment(data[i].date).format("YYYY-MM-DD") + ' <input type="button" value="✘" onclick="unCancelWeek(\'' + data[i]._id + '\')" class="btn btn-danger btn-xs" /></td></tr>';
    }
    tbody += "</tbody>"
    $("#cancelledWeeks").append(tbody);
  });
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
    window.scrollTo(0,document.body.scrollHeight);
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
    $("#currentAdmins").find("tr:gt(0)").remove();
    var i, line, lines = "", dangerButton;
    for (i=0; i < data.length; i++) {
      if (data[i]._id.toString() === user._id.toString()) {
        dangerButton = ' <input type="button" disabled value="✘" class="btn btn-default btn-xs" />';
      } else {
        dangerButton = ' <input type="button" value="✘" onclick=\'removeAdmin("' + data[i]._id + '")\' class="btn btn-danger btn-xs" />';
      }
      line = '<tr><td>' + data[i].firstName + ' ' + data[i].lastName + dangerButton + '</td><td>' + data[i].email + '</td></tr>';
      lines += line;
    }
    $("#currentAdmins").append(lines);
    $("#adminDetails").toggle();
    $("#execs1").toggle();
    $("#execs2").toggle();
    window.scrollTo(0,document.body.scrollHeight);

    // For admins, function to search users to add them as admins
    // (Inside the AJAX callback because it didn't work outside)
    $("#adminButton").on("click", function(e) {
      if ($("#adminInput").val().length < 4) {
        $("#tooShort").show();
        return false;
      } else {
        $("#tooShort").hide();
        $("#adminResults").hide();
        e.preventDefault();
        searchAdmins();
      }
    });
    $("#adminInput").keyup(function(event){
        if(event.keyCode == 13){
            $("#adminButton").click();
        }
    });
 
  });
};

// Function for finding users to add them as admins
var searchAdmins = function() {
  var input = $("#adminInput").val();
  $.ajax({
    url: "searchAdmins",
    cache: false,
    dataType: "json",
    method: "GET",
    data: {
      adminInput: input
    }}).done(function(data) {
      $("#adminResults").find("tr:gt(0)").remove();
      var i, line, lines = "";
      for (i=0; i < data.length; i++) {
        line = '<tr><td><img class="user" src="' + data[i].profilePicture + '" /> ' + data[i].firstName + ' ' + data[i].lastName + ' <button class="btn btn-success" onclick="makeAdmin(\'' + data[i]._id + '\')">Add as admin</button></td><td>' + data[i].email + '</td></tr>';
        lines += line;
      }
      $("#adminResults").append(lines);
      $("#adminResults").show();
  });
  return false;
};

// Function to make a user an admin
var makeAdmin = function(userid) {
  $.ajax({
    url: "makeAdmin",
    dataType: "json",
    method: "POST",
    data: {
      userid: userid
    }}).done(function(data) {
      $("#adminResults").hide();
      showAdmins();
      showAdmins();
  });
  return false;
};
// Function to remove a user an admin
var removeAdmin = function(userid) {
  $.ajax({
    url: "removeAdmin",
    dataType: "json",
    method: "POST",
    data: {
      userid: userid
    }}).done(function(data) {
      showAdmins();
      showAdmins();
      window.scrollTo(0,document.body.scrollHeight);
  });
  return false;
};
