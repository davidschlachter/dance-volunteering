$(document).ready(function() {
  // Add an event listener for the Privacy Policy
  $("a#showPrivacyPolicy").click(function (e) {
    e.preventDefault();
    $('#privacyPolicy').modal('show');
    return false;
  });
  
});