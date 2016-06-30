
$(document).ready(function() {
  $.ajax({
    url: "getShifts",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
    console.log("Got the following shifts", data);
    $("#shifts").find("tr:gt(0)").remove();
    var i, line, lines, userName, profilePicture, tableText;
    for (i=0; i < data.length; i++) {
      if (data[i].Vol[0] !== null && typeof data[i].Vol[0] === 'object') {
        userName = data[i].Vol[0].firstName + " " + data[i].Vol[0].lastNameInitial;
        profilePicture = data[i].Vol[0].profilePicture;
        tableText = '<img class="user" src="' + profilePicture + '" />' + userName;
      } else {
        tableText = "<a href='volunteer' class='btn btn-primary'>Volunteer</a>"
      }
      line = '<tr><td>' + data[i].time + '</td><td>' + tableText + '</td></tr>';
      lines += line;
    }
    $("#shifts").append(lines);
    $("#date").text("Volunteering shifts for " + moment(data[0].date).format("dddd MMMM D, YYYY") + ':');
  });
});