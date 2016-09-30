// Show the admin tools
$(document).ready(function () {
  $("#adminTools").show();
  $("#adminEmail").show();
  getExtraText();

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

// For admins, show the buttons to delete other users' shifts after clicking the button for this
function showDelButtons() {
  var i;
  if ($('#otherDel1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $(".otherDel").show();
    $("#otherDel1").hide();
    $("#otherDel2").show();
  } else {
    $(".otherDel").hide();
    $("#otherDel1").show();
    $("#otherDel2").hide();
  }
};


// For admins, show the interface to cancel a week
function showCancel() {
  var i;
  if ($('#cancel1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $("#cancelWeeks").show();
    $("#cancel1").hide();
    $("#cancel2").show();
    getCancelled();
    $("#cancelButton").on("click", function (e) {
      cancelWeek($("#datepicker").val());
    });
  } else {
    $("#cancelWeeks").hide();
    $("#cancel1").show();
    $("#cancel2").hide();
  }
};

function cancelWeek(week) {
  if (typeof week === "undefined" || week === "") {
    return (console.log("No week selected"));
  } else {
    $.ajax({
      url: "cancelWeek",
      data: {
        week: week,
        _csrf: csrf
      },
      method: "POST"
    }).done(function (data) {
      getCancelled();
    });
  }
};

function unCancelWeek(id) {
  $.ajax({
    url: "unCancelWeek",
    method: "POST",
    data: {
      weekID: id,
      _csrf: csrf
    }
  }).done(function (data) {
    getCancelled();
  });
};

function getCancelled() {
  $("#cancelledWeeks").find("tr:gt(0)").remove();
  $.ajax({
    url: "getCancelled",
    method: "GET",
    cache: false
  }).done(function (data) {
    var i, tbody = "<tbody>";
    if (data.length === 0) {
      tbody += "<tr><td>No cancelled weeks</td></tr></tbody>";
      $("#cancelledWeeks").append(tbody);
      return;
    }
    for (i = 0; i < data.length; i++) {
      tbody += '<tr><td>' + moment(data[i].date).format("YYYY-MM-DD") + ' <input type="button" id="' + data[i]._id + '" value="✘" class="btn btn-danger btn-xs" /></td></tr>';
    }
    tbody += "</tbody>"
    $("#cancelledWeeks").append(tbody);
    for (i = 0; i < data.length; i++) {
      $('#' + data[i]._id).on('click', function () {
        unCancelWeek($(this)[0].id)
      });
    }
  });
};

// For admins, function to delete any shift
function deleteAnyShift(shiftID, volID) {
  $.ajax({
    url: "deleteAnyShift",
    dataType: 'json',
    data: {
      shiftID: shiftID,
      volID: volID,
      _csrf: csrf
    },
    method: "POST"
  }).done(function (data) {
    updateShifts();
  });
};

// For admins, function to show details (last names and email addresses) for this Friday's volunteers
function showDetails() {
  var i;
  if ($('#details1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $("#userDetails").show();
    $("#details1").hide();
    $("#details2").show();
  } else {
    $("#userDetails").hide();
    $("#details1").show();
    $("#details2").hide();
  }
  $.ajax({
    url: "getDetails",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function (data) {
    $("#userDetails").find("tr:gt(0)").remove();
    var i, j, line, lines = "";
    for (i = 0; i < data.length; i++) {
      for (j = 0; j < data[i].Vol.length; j++) {
        line = '<tr><td>' + data[i].time + '</td><td>' + data[i].Vol[j].firstName + ' ' + data[i].Vol[j].lastName + '</td><td>' + data[i].Vol[j].email + '</td></tr>';
        lines += line;
      }
    }

    $("#userDetails").append(lines);
  });
};

// For admins, function to show all admins
function showAdmins() {
  var i;
  if ($('#execs1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $("#adminDetails").show();
    getAdmins();
    $("#execs1").hide();
    $("#execs2").show();
  } else {
    $("#adminDetails").hide();
    $("#execs1").show();
    $("#execs2").hide();
  }

};

var getAdmins = function () {
  $.ajax({
    url: "getAdmins",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function (data) {
    $("#currentAdmins").find("tr:gt(0)").remove();
    var i, line, lines = "",
      dangerButton;
    for (i = 0; i < data.length; i++) {
      if (data[i]._id.toString() === user._id.toString()) {
        dangerButton = ' <input type="button" disabled value="✘" class="btn btn-default btn-xs" />';
      } else {
        dangerButton = ' <input type="button" id="delAdmin' + data[i]._id + '" value="✘" data-adminName="' + data[i].firstName + ' ' + data[i].lastName + '" class="btn btn-danger btn-xs" />';
      }
      line = '<tr><td>' + data[i].firstName + ' ' + data[i].lastName + dangerButton + '</td><td>' + data[i].email + '</td></tr>';
      lines += line;
    }
    $("#currentAdmins").append(lines);
    // Add event listeners
    for (i = 0; i < data.length; i++) {
      if (data[i]._id.toString() !== user._id.toString()) {
        $('#delAdmin' + data[i]._id).on('click', function () {
          removeAdmin($(this)[0].id.replace('delAdmin', ''), $(this)[0].attributes['data-adminName'].value)
        });
      }
    }

    // For admins, function to search users to add them as admins
    // (Inside the AJAX callback because it didn't work outside)
    $("#adminButton").on("click", function (e) {
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
    $("#adminInput").keyup(function (event) {
      if (event.keyCode == 13) {
        $("#adminButton").click();
      }
    });
  });
};

// Function for finding users to add them as admins
var searchAdmins = function () {
  var input = $("#adminInput").val();
  $.ajax({
    url: "searchAdmins",
    cache: false,
    dataType: "json",
    method: "GET",
    data: {
      adminInput: input
    }
  }).done(function (data) {
    $("#adminResults").find("tr:gt(0)").remove();
    var i, line, lines = "";
    for (i = 0; i < data.length; i++) {
      line = '<tr><td><img class="user" src="' + data[i].profilePicture + '" /> ' + data[i].firstName + ' ' + data[i].lastName + ' <button id="addAdmin' + data[i]._id + '" class="btn btn-success">Add as admin</button></td><td>' + data[i].email + '</td></tr>';
      lines += line;
    }
    $("#adminResults").append(lines);
    $("#adminResults").show();
    // Add event handlers
    for (i = 0; i < data.length; i++) {
      $('#addAdmin' + data[i]._id).on('click', function () {
        makeAdmin($(this)[0].id.replace('addAdmin', ''))
      });
    }
  });
  return false;
};

// Function to make a user an admin
var makeAdmin = function (userid) {
  $.ajax({
    url: "makeAdmin",
    dataType: "json",
    method: "POST",
    data: {
      userid: userid,
      _csrf: csrf
    }
  }).done(function (data) {
    $("#adminResults").hide();
    getAdmins();
  });
  return false;
};
// Function to remove a user an admin
var removeAdmin = function (userid, adminName) {
  $.ajax({
    url: "removeAdmin",
    dataType: "json",
    method: "POST",
    data: {
      userid: userid,
      _csrf: csrf
    }
  }).done(function (data) {
    $('#delAdmin .modal-body').html('<p>' + adminName + ' has been removed as an admin and will be notified of the change by email.</p>')
    $('#delAdmin').modal('show');
  });
  return false;
};
$('#delAdmin').on('hidden.bs.modal', function () {
  getAdmins();
})


// For admins, show the interface to modify the template 
function showTemplate() {
  var i;
  if ($('#template1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $("#template").show();
    $("#template1").hide();
    $("#template2").show();
    getTemplate();
  } else {
    $("#template").hide();
    $("#template1").show();
    $("#template2").hide();
  }
};


function getTemplate() {
  $("#templateTable tbody").remove();
  $.ajax({
    url: "getTemplate",
    method: "GET",
    cache: false
  }).done(function (data) {
    var i, checked, tbody = "<tbody>";
    if (data.length === 0) {
      tbody += "<tr><td>No shifts were found in the template</td></tr></tbody>";
      $("#templateTable").append(tbody);
      return;
    }
    for (i = 0; i < data.length; i++) {
      if (data[i].newUsers === true) {
        checked = "checked";
      } else {
        checked = "";
      }
      tbody += '<tr><td><input type="text" name="time" value="' + data[i].time + '"></td><td><input type="number" value="' + (data[i].nSpots - data[i].nExec) + '"></td><td><input type="number" value="' + data[i].nExec + '"></td><td><input type="checkbox" ' + checked + '></td></tr>';
    }
    tbody += "</tbody>"
    $("#templateTable").append(tbody);
  });
};

// Add or remove a row from the templateTable
function deleteLastRow() {
  $("#templateTable tbody tr:last").remove();
};

function addRow() {
  var string = '<tr><td><input type="text" name="time"></td><td><input type="number"></td><td><input type="number"></td><td><input type="checkbox"></td></tr>';
  $("#templateTable tbody").append(string);
};

// Save the new templates
function newTemplate() {
  var templates = {
      d: [],
      _csrf: csrf
    },
    check, i, table = $("#templateTable tbody")[0];
  for (i = 0; i < table.rows.length; i++) {
    if ($(table.rows[i].cells[3]).find('input').is(':checked')) {
      check = true;
    } else {
      check = false;
    }
    templates.d.push({
      time: $(table.rows[i].cells[0]).find('input').val(),
      nSpots: (parseInt($(table.rows[i].cells[1]).find('input').val(), 10) + parseInt($(table.rows[i].cells[2]).find('input').val(), 10)),
      nExec: $(table.rows[i].cells[2]).find('input').val(),
      newUsers: check
    });
  }
  console.log("Sending:", templates);
  $.ajax({
    url: "newTemplate",
    method: "POST",
    dataType: "JSON",
    data: templates
  }).done(function (data) {
    console.log(data);
    showTemplate();
    $('#newTemplate').modal('show');
  });
};

// Get the extra text for printing
function getExtraText() {
  $.ajax({
    url: "getExtraText",
    method: "GET",
    cache: false
  }).done(function (data) {
    $("#extraText").html(data.text);
    $("#printingTextArea").val(data.text.replace(/<br>/g, '\n'));
  });
};

// For admins, show the interface to edit the extra printed text
function showPrinting() {
  var i;
  if ($('#printing1').is(':visible')) {
    i = true;
  } else {
    i = false;
  }
  $(".btnHide").hide();
  $(".btnShow").show();
  if (i === true) {
    $("#printing").show();
    $("#printing1").hide();
    $("#printing2").show();
  } else {
    $("#printing").hide();
    $("#printing1").show();
    $("#printing2").hide();
  }
};

// For admins, set the printing text
function setPrintingText() {
  var extraText = {
    "extraText": $("#printingTextArea").val(),
    _csrf: csrf
  };
  console.log("Sending:", extraText);
  $.ajax({
    url: "setExtraText",
    method: "POST",
    dataType: "JSON",
    data: extraText
  }).done(function (data) {
    $('#newExtraText').modal('show');
    showPrinting();
    getExtraText();
  });
};

// Event handlers for the admin buttons
$("#otherDel1").on("click", showDelButtons);
$("#otherDel2").on("click", showDelButtons);
$("#details1").on("click", showDetails);
$("#details2").on("click", showDetails);
$("#printing1").on("click", showPrinting);
$("#printing2").on("click", showPrinting);
$("#execs1").on("click", showAdmins);
$("#execs2").on("click", showAdmins);
$("#cancel1").on("click", showCancel);
$("#cancel2").on("click", showCancel);
$("#template1").on("click", showTemplate);
$("#template2").on("click", showTemplate);
$("#printingButton").on("click", setPrintingText);
$("#templateAddRow").on("click", addRow);
$("#templateRemoveRow").on("click", deleteLastRow);
$("#templateSaveTemplate").on("click", newTemplate);