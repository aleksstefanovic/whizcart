import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import { Items } from '../../../api/items/index';
import template from './extraPage.html';
import { Meteor } from 'meteor/meteor'; 

class ExtraPage{
	constructor($stateParams){

	}
};

const name = 'extraPage';

export default angular.module(name, [
  angularMeteor
]).component(name, {
  template,
  controllerAs: name,
  controller: ExtraPage
}).config(config);

function config($stateProvider) {
  'ngInject';
 
  $stateProvider.state('extraPage', {
    url: '/extraPage',
    template: '<extra-page></extra-page>',
  });

}