
$(document).ready(function() {
  $.ajax({
    url: "getShifts",
    cache: false,
    dataType: "json",
    method: "GET"
  }).done(function(data) {
    console.log("Got the following shifts", data);
    $("#shifts").find("tr:gt(0)").remove();
    var i, line, lines;
    for (i=0; i < data.length; i++) {
      line = '<tr><td>' + data[i].time + '</td><td>' + data[i].Vol[0] + '</td></tr>';
      lines += line;
    }
    $("#shifts").append(lines);
    $("#date").text("Volunteering shifts for " + moment(data[0].date).format("dddd MMMM D, YYYY") + ':');
  });
});