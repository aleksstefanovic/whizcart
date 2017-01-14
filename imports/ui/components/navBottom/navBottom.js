import angular from 'angular';
import angularMeteor from 'angular-meteor';

import template from './navBottom.html';

const name = 'navBottom';

// create a module
export default angular.module(name, [
  angularMeteor
]).component(name, {
  template,
  controllerAs: name
});
