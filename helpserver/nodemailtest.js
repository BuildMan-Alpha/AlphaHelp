var emailcred = require("./emailcred");

var nodemailer = require('nodemailer'); 
// create reusable transporter object using the default SMTP transport 
var transporter = nodemailer.createTransport('smtps://'+emailcred.user+":"+emailcred.password+"@"+emailcred.host);
 
// setup e-mail data with unicode symbols 
var mailOptions = {
    from: emailcred.user, // sender address 
    to: 'documentation@alphasoftware.com', // list of receivers 
    subject: 'Test', // Subject line 
    text: 'nodemailer test', 
};
 
// send mail with defined transport object 
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});