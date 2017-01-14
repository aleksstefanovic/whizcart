import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import { Items } from '../../../api/items/index';
import template from './aboutUs.html';
import { Meteor } from 'meteor/meteor'; 

class AboutUs{
	constructor($stateParams){

	}
};

const name = 'aboutUs';

export default angular.module(name, [
  angularMeteor
]).component(name, {
  template,
  controllerAs: name,
  controller: AboutUs
}).config(config);

function config($stateProvider) {
  'ngInject';
 
  $stateProvider.state('aboutUs', {
    url: '/aboutUs',
    template: '<about-us></about-us>',
  });

}