
$(document).ready(function () {
  // Description
  var authMethod = getCookie("authMethod");
  var userName = decodeURIComponent(getCookie("userName"));
  if (authMethod != false && userName != false) {
    $("#Welcome").html("<br>Welcome back " + userName + "!");
    $("#Welcome").show();
    $("#newUser").hide();

    $("#secondThoughts").show();
    $("#secondThoughts").html('<br><a href="login" onclick="clearCookies()">Not ' + userName + '?</a>');
    $("#secondThoughts").click(function (e) {
      clearCookies();
      return true;
    });
  }

  // Add an event listener for the Privacy Policy
  $("a#showPrivacyPolicy").click(function (e) {
    e.preventDefault();
    $('#privacyPolicy').modal('show');
    return false;
  });

});


// Function to get a cookie
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) {
    return parts.pop().split(";").shift();
  } else { return false; }
};

// Function to clear the cookies
function clearCookies() {
  document.cookie = "authMethod" + '=null; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path= /';
  document.cookie = "userName" + '=null; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Path= /';
  return true;
};

// Function to show 'Loading…'
$('a[data-loading-text]').click(function () {
  var btn = $(this);
  btn.button('loading');

  $(".btn").each(function () {
    $(this).hide();
  });
  $("#loading").show();
  return true;
})
