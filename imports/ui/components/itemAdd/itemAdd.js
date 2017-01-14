import angular from 'angular'
import angularMeteor from 'angular-meteor';
import template from './itemAdd.html';
import utilsPagination from 'angular-utils-pagination';
import {Items} from '../../../api/items/index';
import {Stores} from '../../../api/stores/index';
import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/tmeasday:publish-counts';
import addToShoppingList from '../../../../scripts/addToShoppingList.js';
import addFavItem from '../../../../scripts/addFavItem.js';
import addFavStore from '../../../../scripts/addFavStore.js';
import getPrice from '../../../../scripts/getPrice.js';

class ItemAdd {

      constructor($scope, $reactive) {
        'ngInject';

        $reactive(this).attach($scope);
        this.subscribe('stores');
        this.perPage = 10;
        this.page = 1;
        this.sort = {
          name: 1
        };
        this.sort2 = {
          code: 1
        };
        this.searchText = '';
        /*this.subscribe('items', () => [{
          limit: parseInt(this.perPage),
          skip: parseInt((this.getReactively('page') - 1) * this.perPage),
          sort: this.getReactively('sort')}
        ]);*/
        this.showMe = false;
        this.helpers(
          {
            items() { 
	    var itemCursor = Items.find({ 
		"name": {
		$regex: `.*${this.getReactively('searchText')}.*`,
			$options : 'i'}
			      },{sort : this.getReactively('sort')});
	    var storeCursor = Stores.find({
		"code": {
		$regex: `.*${this.getReactively('searchText')}.*`,
			$options : 'i'}
			      },{sort : this.getReactively('sort2')});
	    var result = [];
	    itemCursor.forEach ( function(item) {
	    	result.push(item);
	    });
	    storeCursor.forEach ( function(store) {
	    	result.push(store);
	    });
	    return result;
	    },
            itemsCount() {return Counts.get('numberOfItems');}
          }
        );
	};
  change(){
      if (this.searchText === ''){
        this.showMe = false;
        return;
      };
      if (this.showMe === true){
        return;
      };
      this.showMe = !this.showMe;
  };
	addStoreToFavs(){
      var postalCode = this.searchText;
        var storeObj = Stores.findOne({"code":postalCode});
        var storeId = storeObj._id;
        var storeFran = storeObj.franchise;
      console.log(storeId);
      var userId = Meteor.user()._id;
      var response = addFavStore(postalCode, storeFran,storeId,userId);
        this.reset();
	};
	addItemToFavs(){
      var itemName = this.searchText;
        var itemId = Items.findOne({"name":itemName})._id;
      console.log(itemId);
      var userId = Meteor.user()._id;
      var response = addFavItem(itemName,itemId,userId);
        this.reset();
	};
	addToShoppingList(){
        var itemName = this.searchText;
        var itemId = Items.findOne({"name":itemName})._id;
        console.log(itemId);
        var userId = Meteor.user()._id;
        addToShoppingList (itemName, itemId, userId);        
		this.reset();
	};
      getPrice() {
            var itemName = this.searchText;
            var itemObj = Items.findOne({"name":itemName});
          var itemId = itemObj._id;
          var itemdata = itemObj.data;
          var distance = 10;
          var franchises = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];
            var userLocation = Session.get('location');
            console.log("USER LOCATION:"+JSON.stringify(userLocation));
            if (userLocation == undefined || userLocation == null) {
                alert ("Could not get your location, proceeding globally");
                userLocation = '';
            }
            console.log("getting prices:"+itemId+":"+JSON.stringify(itemdata)+":"+distance+":"+JSON.stringify(franchises)+":"+userLocation);
          var priceobj = getPrice (itemId, itemdata, distance, franchises, userLocation);
          var bestPrice = priceobj.price;
          console.log("BEST PRICE FINAL:"+bestPrice);
          alert ("You can get "+itemObj.name+" for "+bestPrice+" at the "+priceobj.storename+" on "+priceobj.storeaddress+"!");
      };
  pageChanged(newPage) {
    this.page = newPage;
  };

  sortChanged(sort) {
    this.sort = sort;
  };
  reset () {
    this.searchText = '';
	this.showMe = false;
  };
}

const name = 'itemAdd';

export default angular.module(name, [angularMeteor,utilsPagination])
	.component(name,{
		template,
		controllerAs: name,
		controller: ItemAdd
	});
