import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import { Items } from '../../../api/items/index';
import template from './contactUs.html';
import { Meteor } from 'meteor/meteor'; 
import sendEmail from '../../../../scripts/sendEmail.js';


class contactUs{
	constructor($scope, $reactive){
   'ngInject'; 
   $reactive(this).attach($scope);

   this.showIssueBox = false;
   this.issueBoxText = "";
 }

 submitIssue () {
  this.showIssueBox = true;
};

sendIssue () {
  var userId;
  if (Meteor.user() != null){
    userId = Meteor.user()._id;
  } else {
    userId = "";
  }

  var emailBody = this.issueBoxText;
  this.issueBoxText = "Sending message...";
  sendEmail (emailBody, userId);
  this.issueBoxText = "Message sent!";
  this.issueBoxText = "";
  this.showIssueBox = false;
};

cancelIssue () {
  this.issueBoxText = "";
  this.showIssueBox = false;
};
};



const name = 'contactUs';

export default angular.module(name, [
  angularMeteor
  ]).component(name, {
    template,
    controllerAs: name,
    controller: contactUs
  }).config(config);

  function config($stateProvider) {
    'ngInject';

    $stateProvider.state('contactUs', {
      url: '/contactUs',
      template: '<contact-us></contact-us>',
    });

  };