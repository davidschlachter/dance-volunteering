var nodemailer = require('nodemailer');


exports.welcome = function (user, email) {
  var transporter = nodemailer.createTransport('smtps://' + email.user + ':' + email.pass + '@' + email.server);
  
  var mailOpts = {
    from: '"' + email.name + '" <' + email.user + '>',
    to: user.email,
    subject: "Welcome to OSDS Volunteering",
    text: "Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website",
    html: "<p>Welcome to OSDS Volunteering! You'll receive an email each time you volunteer. You can configure your email preferences on the volunteering website</p>"
  };

  transporter.sendMail(mailOpts, function (error, info) {
    if (error) { return console.log(error); }
    console.log('Message sent: ' + info.response);
  });
};
