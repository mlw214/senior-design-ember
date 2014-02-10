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
  from: 'adamillerlehigh@gmail.com',
  subject: 'Experiment Alert',
};

exports.setRecipients = function (recipients) {
  mailOptions.to = recipients;
};

exports.send = function (fn, text) {
  mailOptions.text = text;
  smtpTransport.sendMail(mailOptions, function (err, response) {
    fn(err, response);
  });
};