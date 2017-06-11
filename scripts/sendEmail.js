export default function sendEmail (emailBody, userId) {
    var email = "whizzkart@gmail.com";
    var subject = 'CUSTOMER ISSUE - ' + emailBody.substring(0,10);
    var text =  'BODY:'+emailBody+', USER ID:'+userId;
    Email.send({ to:email, from:email, subject:subject, text:text });
}
