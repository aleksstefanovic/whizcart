import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import template from './whizcart.html';
import { name as dashboard } from '../dashboard/dashboard';
import { name as Navigation } from '../navigation/navigation';
import { name as ExtraPage } from '../extraPage/extraPage';
import { name as SecondPage } from '../secondPage/secondPage';
import { name as AboutUs } from '../aboutUs/aboutUs';
import { name as ContactUs } from '../contactUs/contactUs';
import { name as MainPage } from '../mainPage/mainPage';
import {name as NavBottom} from '../navBottom/navBottom';
import './whizcart.css';

class WhizCart {}

const name = 'whizcart';


// create a module
export default angular.module(name, [
  angularMeteor,
  uiRouter,
  dashboard,
  ExtraPage,
  MainPage,
  SecondPage,
  AboutUs,
  ContactUs, 
  Navigation,
  NavBottom,
  'accounts.ui'
]).component(name, {
  template,
  controllerAs: name,
  controller: WhizCart
})
  .config(config)
  .run(run);

function config($locationProvider, $urlRouterProvider) {
  'ngInject';

  $locationProvider.html5Mode(true);

  $urlRouterProvider.otherwise('/dashboard');
}

function run($rootScope, $state) {
  'ngInject';
 
  $rootScope.$on('$stateChangeError',
    (event, toState, toParams, fromState, fromParams, error) => {
      if (error === 'AUTH_REQUIRED') {
        $state.go('dashboard');
      }
    }
  );
}
