import angular from 'angular';
import angularMeteor from 'angular-meteor';
import uiRouter from 'angular-ui-router';
import { Items } from '../../../api/items/index';
import { Stores } from '../../../api/stores/index';
import template from './itemDetails.html';
import { Meteor } from 'meteor/meteor'; 
import getPrice from '../../../../scripts/getPrice.js';
import addFavItem from '../../../../scripts/addFavItem.js';

class ItemDetails {
  constructor($stateParams, $scope, $reactive) {
    'ngInject';
 	$reactive(this).attach($scope);
  this.subscribe('items');
  this.subscribe('stores');
    this.itemId = $stateParams.itemId;

    this.helpers({
    	item(){
    		return Items.findOne({
    			_id: $stateParams.itemId
    		});
    	}
    });
  }
  fav(){
      var itemId = this.item._id;
      console.log(itemId);
      var itemName = this.item.name;
      var userId = Meteor.user()._id;
      var response = addFavItem(itemName,itemId,userId);
  }
  getPrice() {
      var itemId = this.item._id;
      var itemdata = this.item.data;
      var distance = 10;
      var franchises = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];
        var userLocation = Session.get('location');
        console.log("USER LOCATION:"+JSON.stringify(userLocation));
        if (userLocation == undefined || userLocation == null) {
            alert ("Could not get your location, proceeding globally");
            userLocation = '';
        }
      var priceobj = getPrice (itemId, itemdata, distance, franchises, userLocation);
      this.item.price = priceobj.price;
      console.log("BEST PRICE FINAL:"+this.item.price);
  }
}
 
const name = 'itemDetails';

// create a module
export default angular.module(name, [
  angularMeteor
]).component(name, {
  template,
  controllerAs: name,
  controller: ItemDetails
}).config(config);

function config($stateProvider) {
  'ngInject';
 
  $stateProvider.state('itemDetails', {
    url: '/:itemId',
    template: '<item-details></item-details>',
    resolve: {
    	currentUser($q) {
    		if (Meteor.userId() === null) {
    			return $q.reject('AUTH_REQUIRED');
    		} else {
    			return $q.resolve();
    		}
    	}
    }
  });
}
