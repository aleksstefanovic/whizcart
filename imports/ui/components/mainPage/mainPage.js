import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import utilsPagination from 'angular-utils-pagination';
import template from './mainPage.html';
import { Items } from '../../../api/items/index';
import { name as dashboard } from '../dashboard/dashboard';
import { name as itemRemove } from '../itemRemove/itemRemove';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { name as ItemsSort } from '../itemsSort/itemsSort';

class MainPage {
  constructor($scope, $reactive) {
    'ngInject';

    $reactive(this).attach($scope);
    this.perPage = 10;
    this.page = 1;
    this.sort = {
      name: 1
    };
    this.searchText = '';
    this.subscribe('items', () => [{
      limit: parseInt(this.perPage),
      skip: parseInt((this.getReactively('page') - 1) * this.perPage),
      sort: this.getReactively('sort')},
    this.getReactively('searchText')
    ]);
    this.showMe = false;
    this.showMe2 = false;
    this.showMe3 = false;
    this.helpers(
      {
        items() { return Items.find({}, {sort : this.getReactively('sort')});},
        isLoggedIn() {return !!Meteor.user();},
        itemsCount() {return Counts.get('numberOfItems');}
      }
    );
  };

  myFunc(){
      if (this.searchText === ''){
        this.showMe = false;
        return;
      };
      if (this.showMe === true){
        return;
      };
      this.showMe = !this.showMe;
  };
  myFunc2(){
      this.showMe2 = !this.showMe2;
  };
  myFunc3(){
      this.showMe3 = !this.showMe3;
  };
  pageChanged(newPage) {
    this.page = newPage;
  };

  sortChanged(sort) {
    this.sort = sort;
  };
}

const name = 'mainPage';

// create a module
export default angular.module(name, [
  angularMeteor,
  uiRouter,
  dashboard,
  itemRemove,
  ItemsSort,
  utilsPagination
]).component(name, {
  template,
  controllerAs: name,
  controller: MainPage
})
  .config(config);

function config($stateProvider) {
  'ngInject';
  $stateProvider
    .state('mainPage', {
      url: '/mainPage',
      template: '<main-page></main-page>'
    });
}
