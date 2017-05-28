export default function sendEmail (emailBody, userId) {
    Meteor.call(
        'sendEmail',
        'CUSTOMER ISSUE - ' + emailBody.substring(0,10),
        'BODY:'+emailBody+', USER ID:'+userId 
    );
}
