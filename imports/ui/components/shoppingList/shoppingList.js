import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import utilsPagination from 'angular-utils-pagination';
import template from './shoppingList.html';
import { Items } from '../../../api/items/index';
import { Stores } from '../../../api/stores/index';
import { Meteor } from 'meteor/meteor';
import { name as itemAdd } from '../itemAdd/itemAdd';
import { name as appMaps } from '../appMaps/appMaps';
import { name as itemRemove } from '../itemRemove/itemRemove';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { name as ItemsSort } from '../itemsSort/itemsSort';

class ShoppingList {
  constructor($scope, $reactive) {
    'ngInject';

    $reactive(this).attach($scope);
    this.perPage = 10;
    this.page = 1;
    this.sort = {
      name: 1
    };
    this.searchText = '';
    this.subscribe('stores');
    this.subscribe('items', () => [{
      limit: parseInt(this.perPage),
      skip: parseInt((this.getReactively('page') - 1) * this.perPage),
      sort: this.getReactively('sort')}, this.getReactively('searchText')
    ]);
    this.showMeShoppingLists = false;
    this.showMeFavStores = false;
    this.showMeMap = true;
    this.showMeFavItems = false;
    this.helpers(
      {
        items() {return Items.find({}, {sort : this.getReactively('sort')});},
        shoppingList() {
            var user = Meteor.user();
            if (user == undefined || user.profile == undefined || user.profile.shoppingLists.length == 0) {
                return [];
            }
            var userProfile = user.profile;
            var shoppingList = userProfile.shoppingLists[0].items;
            var shoppingListData = [];
            for (var i in shoppingList) {
                var itemObj = Items.findOne({"_id":shoppingList[i]});
                if (itemObj != undefined) {
                    shoppingListData.push(itemObj);
                }
            }
            return shoppingListData;
        },
        favStores() {
            var user = Meteor.user();
            if (user == undefined || user.profile == undefined) {
                return [];
            }
            var userProfile = user.profile;
            var favStores = userProfile.favStores;
            var favStoreData = [];
            for (var i in favStores) {
                var storeObj = Stores.findOne({"_id":favStores[i]});
                if (storeObj != undefined) {
                    favStoreData.push(storeObj);
                }
            }
            return favStoreData;
        },
        favItems() {
            var user = Meteor.user();
            if (user == undefined || user.profile == undefined) {
                return [];
            }
            var userProfile = user.profile;
            var favItems = userProfile.favItems;
            var favItemData = [];
            for (var i in favItems) {
                console.log("Item:"+i);
                var itemObj = Items.findOne({"_id":favItems[i]});
                if (itemObj != undefined) {
                    favItemData.push(itemObj);
                }
            }
            console.log("fav item data:"+JSON.stringify(favItemData));
            return favItemData;
        },
        isLoggedIn() {return !!Meteor.user();},
        itemsCount() {return Counts.get('numberOfItems');},
      }
    );
  };

  showShoppingLists(){
      this.showMeShoppingLists = !this.showMeShoppingLists;
  };
  showFavStores(){
      this.showMeFavStores = !this.showMeFavStores;
  };
  showMap(){
      //this.showMeMap = !this.showMeMap;
  };
  showFavItems(){
      this.showMeFavItems = !this.showMeFavItems;
  };
  pageChanged(newPage) {
    this.page = newPage;
  };

  sortChanged(sort) {
    this.sort = sort;
  };
}

const name = 'shoppingList';

$(document).on("scrollstart",function(){
  alert("Started Scrolling!");
});

// create a module
export default angular.module(name, [
  angularMeteor,
  uiRouter,
  itemAdd,
  itemRemove,
  appMaps,
  ItemsSort,
  utilsPagination
]).component(name, {
  template,
  controllerAs: name,
  controller: ShoppingList
})
  .config(config);

function config($stateProvider) {
  'ngInject';
  $stateProvider
    .state('items', {
      url: '/items',
      template: '<shopping-list></shopping-list>'
    });
}
