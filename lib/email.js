var nodemailer = require('nodemailer'),
    smtpTransport, mailOptions;

smtpTransport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: {
    user: 'adamillerlehigh@gmail.com',
    pass: 'awesomeproject'
  }
});

mailOptions = {
  from: 'adamillerlehigh@gmail.com'
};

exports.setRecipients = function (recipients) {
  mailOptions.to = recipients;
};

exports.setSubject = function (subject) {
  mailOptions.subject = subject;
};

exports.send = function (fn, text) {
  mailOptions.text = text;
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function (err, response) {
    fn(err, response);
  });
};