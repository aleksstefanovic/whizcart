import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import { Items } from '../../../api/items/index';
import template from './secondPage.html';
import { Meteor } from 'meteor/meteor'; 

class SecondPage{
	constructor($stateParams){

	}
};

const name = 'secondPage';

export default angular.module(name, [
  angularMeteor
]).component(name, {
  template,
  controllerAs: name,
  controller: SecondPage
}).config(config);

function config($stateProvider) {
  'ngInject';
 
  $stateProvider.state('secondPage', {
    url: '/secondPage',
    template: '<second-page></second-page>',
  });

}