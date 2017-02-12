import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import template from './foodHero.html';
import { name as appMaps } from '../appMaps/appMaps';
import { name as Navigation } from '../navigation/navigation';
import { name as ItemDetails } from '../itemDetails/itemDetails';
import { name as ExtraPage } from '../extraPage/extraPage';
import { name as SecondPage } from '../secondPage/secondPage';
import { name as AboutUs } from '../aboutUs/aboutUs';
import { name as MainPage } from '../mainPage/mainPage';
import {name as NavBottom} from '../navBottom/navBottom';
class FoodHero {}

const name = 'foodHero';


// create a module
export default angular.module(name, [
  angularMeteor,
  uiRouter,
  appMaps,
  ExtraPage,
  MainPage,
  SecondPage,
  AboutUs,
  ItemDetails,
  Navigation,
  NavBottom,
  'accounts.ui'
]).component(name, {
  template,
  controllerAs: name,
  controller: FoodHero
})
  .config(config)
  .run(run);

function config($locationProvider, $urlRouterProvider) {
  'ngInject';

  $locationProvider.html5Mode(true);

  $urlRouterProvider.otherwise('/mainPage');
}

function run($rootScope, $state) {
  'ngInject';
 
  $rootScope.$on('$stateChangeError',
    (event, toState, toParams, fromState, fromParams, error) => {
      if (error === 'AUTH_REQUIRED') {
        $state.go('mainPage');
      }
    }
  );
}
