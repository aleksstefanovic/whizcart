import angular from 'angular';
import angularMeteor from 'angular-meteor';
import 'angular-simple-logger';
import 'angular-google-maps';
import uiRouter from 'angular-ui-router';
import template from './dashboard.html';
import { Meteor } from 'meteor/meteor'; 
import {Items} from '../../../api/items/index';
import {Stores} from '../../../api/stores/index';
import './dashboard.css';
import getRelevantStores from '../../../../scripts/getRelevantStores.js';
import addFavStore from '../../../../scripts/addFavStore.js';
import utilsPagination from 'angular-utils-pagination';
import { Counts } from 'meteor/tmeasday:publish-counts';
import addToShoppingList from '../../../../scripts/addToShoppingList.js';
import addFavItem from '../../../../scripts/addFavItem.js';
import getPrice from '../../../../scripts/getPrice.js';
import unifyText from '../../../../scripts/unifyText.js';

class dashboard {
	constructor($scope, $rootScope, $compile, $timeout, $reactive) {
		'ngInject'; 
		$reactive(this).attach($scope);
		this.scope = $scope;
		this.subscribe('stores');
		this.subscribe('items');
		this.perPage = 10;
		this.page = 1;
		this.sort = {
			name: 1
		};
		this.sort2 = {
			code: 1
		};
		this.searchText = '';
		this.maxDistance;
		this.showMe = false;
		this.showMeShoppingLists = false;
		this.showMeFavStores = false;
		this.showMeMap = true;
		this.showMeFavItems = false;

		this.itemCards = [];
		this.hasCards = false;

		this.helpers(
		{
			items() { 
				//console.log("finding matches");
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
                //alert(result);
                return result;
            },
            itemsCount() {
            	return Counts.get('numberOfItems');
            },
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
            		//console.log("Item:"+i);
            		var itemObj = Items.findOne({"_id":favItems[i]});
            		if (itemObj != undefined) {
            			favItemData.push(itemObj);
            		}
            	}
            	//console.log("fav item data:"+JSON.stringify(favItemData));
            	return favItemData;
            },
            isLoggedIn() {
            	return !!Meteor.user();
            }
        }
        );

		$scope.showMap = true;
		
		//console.log("From the constructor inside dashboard.js");
		$scope.allFranchisesInSmartCart = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];
		$scope.checked_stores = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];

		$scope.$watch('checked_stores', function(newValue, oldValue, scope){
			//console.log("checked_stores Changed!")

			var removed = $(oldValue).not(newValue).get();	// black magic from stack overflow
			var added = $(newValue).not(oldValue).get();

			//console.log("Removed: " + removed);
			//console.log("Added: " + added);

			if (removed == "" && added != ""){ // If a store was added to the list
				postalCodeChanged($scope.userLocationSearchBox2);
			} 
			else if (removed != "" && added == ""){ // If removed
				//console.log("nothing added!");
				var franchiseReturnCode = setFranchiseReturnCode(removed);

				for (i = $scope.existingStoreMarkers.length - 1; i >= 0; i--) {
					if ($scope.existingStoreMarkers[i].id.includes(franchiseReturnCode)){
						$scope.existingStoreMarkers.splice(i,1);
					}
				}
				$scope.$apply();
			} 
		}, true);

		var _timeout;
		var lastOpenInfoWindow; 
		var oldPlace = null; 
		var scrollTimer; 
		$scope.mapMarkers = [];
		$scope.existingStoreMarkers = [];
		$scope.myTravelMode = "DRIVING";
		$scope.mapBounds;
		$scope.neBounds;
		$scope.swBounds;
		$scope.places;
		$scope.markers=[];
		$scope.destArray = new google.maps.LatLng;
		$scope.franchises = $scope.checked_stores;
		$scope.returnPostalCodes = [];
		$scope.relevantStoresToSearch = [];
		$scope.userLocation;
		$scope.userLocationSearchBox2;

		$scope.maxDistance = 5;

		$scope.mouseOver = false;

		$scope.map = {
			center: {
				latitude: 43.6532,
				longitude: -79.38
			},
			zoom: 9,
			markers: $scope.markers,
			markersEvents: {
				click: function(marker, eventName, model, arguments){
					$scope.map.window.model = model;
					$scope.map.window.show = true;
					//console.log("CLICKED ON A MARKER BRO ");	
				}
			},
			window: {
				marker: {}, 
				show: false, 
				closeClick: function() {
					this.show = false;
				},
			}, 
			options: {
				scrollwheel: true
			},

			events: {

				tilesloaded: function (map) {
					$scope.$apply(function () {
						$scope.actualMapObj = map;
						//console.info('this is the map instance', map);
					});
				},

				/*mouseover: function(map){
					console.log("Inside Mouseover");
					$scope.map.options.scrollwheel = false;
					console.log($scope.map.options.scrollwheel);
				},	*/

				mouseout: function(map){
					//console.log("Mouse left map!");
					$scope.map.options.scrollwheel = false;
					//console.log($scope.map.options.scrollwheel);
					//console.log($scope.mapMarkers);
					//console.log($scope.existingStoreMarkers);
				},

				bounds_changed: function(map) {
					//console.log("Map bounds_Changed event fired!");
					//console.log($scope.markers);
					//console.log($scope.existingStoreMarkers);

					$scope.bounds = map.getBounds();
					$scope.ne = $scope.bounds.getNorthEast();
					$scope.sw = $scope.bounds.getSouthWest();
					$scope.mapSearchBox.options.bounds = new google.maps.LatLngBounds($scope.sw, $scope.ne);

					$scope.map.center = map.getCenter() // To allow the user to drag the map without being forced back to their location

					if (map.getZoom() > 19){
						map.setZoom(14);
					}

					$scope.showMap = false;
					$scope.showMap = true;
					console.log($scope.mapMarkers);
					$scope.$apply();
				},
			}
		};

		$scope.onClick = function(marker, eventName, model) {

			if (marker.key == "userLocationMarker"){
				//console.log("User location marker, quitting function");
				return 
			}


			//console.log("Marker Clicked Two!");
			//console.log("MARKER KEY: " + marker.key);
			var lng, lat;

			$scope.mapMarkers.forEach(function(mapMarker) {
				if (marker.key == mapMarker.id) {
					//console.log(mapMarker.id);
					//console.log(mapMarker.fullName);
					$scope.fullName = mapMarker.fullName;
					$scope.fullAddress = mapMarker.fullAddress;
					$scope.postalCode = mapMarker.postalCode;
					lat = mapMarker.latitude;
					lng = mapMarker.longitude;
					return;
				}
			});

			//console.log($scope.mapMarkers)

			$scope.favouritesButtonClicked = function() {
				//console.log("FavouritesButtonClicked!",$scope.postalCode);
				var postalCode = $scope.postalCode;
				var storeObj = Stores.findOne({"code":postalCode});

				var storeId = storeObj._id;
				var storeFran = storeObj.franchise;
				//console.log(storeId);
				var userId = Meteor.user()._id;
				var response = addFavStore(postalCode, storeFran,storeId,userId);
			}

			model.show = !model.show;
			$scope.activeModel = model;
			//console.log($scope.activeModel.show);
		};  

		$('.angular-google-map-container').click(function(){
			$scope.map.options.scrollwheel = true;
			//console.log($scope.map.options.scrollwheel);
		})

		$(window).scroll(function(){
			$scope.map.options.scrollwheel = false;
			if (scrollTimer){
				clearInterval(scrollTimer);
			}
			scrollTimer = setTimeout(function(){
				$scope.map.options.scrollwheel = true;
			}, 100)
		});


		var foundUserLocationHTML5 = function(position){
			$scope.map.center = {
				latitude: position.coords.latitude, 
				longitude: position.coords.longitude
			};
			$scope.map.zoom = 14;

			$scope.userLocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			}

			var userLocationMarkerInfo = {
				id: "userLocationMarker", 
				latitude: $scope.userLocation.lat,
				longitude: $scope.userLocation.lng,
				icon: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=0|FFFF00|000000'
			}	

			markers.push(userLocationMarkerInfo);
			$scope.mapMarkers = markers;

			$scope.$apply();
		}

		function noUserLocationHTML5(error){
			//console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
		}
		navigator.geolocation.getCurrentPosition(foundUserLocationHTML5, noUserLocationHTML5);

		var delay = (function(){
			var timer = 1000;
			return function(callback, ms){
				clearTimeout(timer);
				timer = setTimeout(callback, ms);
			};
		})();

		var markers = [];

		$scope.windowOptions = {
			boxClass: "infobox",
			boxStyle: {
				backgroundColor: "white",
				border: "2px solid gray",
				padding: "10px",
				size: "210%",
			},
			disableAutoPan: false, 
			maxWidth: 100,
			maxHeight: 200,

			zIndex: null, 
			closeBoxMargin: "10px",
			closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",

			isHidden: false, 
			pane: "floatPane",
			enableEventPropagation: true
		};

		$scope.chkBoxChanged = function(){
			//console.log("Check box changed!");
		}

		function populateDestinationArray(relevantStoresToSearch, destArray){
			for (var i = 0; i < relevantStoresToSearch.length; i++){
				destArray[i] = {
					lat: relevantStoresToSearch[i].lat,
					lng: relevantStoresToSearch[i].lng
				}
			} 

			for (i; i < 25; i++){
				destArray[i] = {
					lat: 0.0000,
					lng: 0.0000
				}
			}
		}


		function setFranchiseReturnCode(franchise){
			if(franchise == "Food Basics") {	
				return "FB";
			}
			else if (franchise == "Sobeys") {
				return "SB";
			}
			else if (franchise == "Zehrs") {
				return "ZH";
			}
			else if (franchise == "FreshCo") {
				return "FC";
			}
			else if (franchise == "NoFrills") {
				return "NF";
			}
			else if (franchise == "Loblaws") {
				return "LB";
			}
			else if (franchise == "Conestoga Mall") {
				return "CM";
			}
		}


		function postalCodeChanged(searchbox){

			//console.log($scope.mapMarkers);
			for(index in $scope.mapMarkers)
			{
				if ($scope.mapMarkers[index].id == "userLocationMarker"){
					$scope.mapMarkers.splice(index,1);
				}
			}

			$scope.returnPostalCodes = []; 
			if ($scope.activeModel){
				$scope.activeModel.show = false;
			}

			$scope.places = searchbox.getPlaces()


			if($scope.places.length == 0){
				console.log("User location not found!");
				return;
			}
			else{
				//console.log("Succesfully found user location!")

				$scope.map.center = $scope.places[0].geometry.location;

				$scope.userLocation = {
					lat: parseFloat($scope.places[0].geometry.location.lat().toFixed(5)),
					lng: parseFloat($scope.places[0].geometry.location.lng().toFixed(5))
				}

				//console.log($scope.userLocation.lat);
				//console.log($scope.userLocation.lng);

				var userLocationMarkerInfo = {
					id: "userLocationMarker", 
					latitude: $scope.userLocation.lat,
					longitude: $scope.userLocation.lng,
					icon: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=0|FFFF00|000000'
				}	

				$scope.mapMarkers.push(userLocationMarkerInfo);

			}
		}

		$scope.maxDistanceChanged = function(){
			if (_timeout) {
				$timeout.cancel(_timeout); // if already a timeout then cancel
			}

			_timeout = $timeout(function(){
				_timeout = null;

				if ($scope.userLocation == null){
					//console.log("No user location, cancelling!");
					return;
				}
				postalCodeChanged($scope.userLocationSearchBox2);
			})
		}

		$scope.searchBoxUserLocation = {
			template: 'searchBoxUserLocation.tpl.html',
			options: {
				bounds: new google.maps.LatLngBounds($scope.swBounds, $scope.neBounds),
			},
			events: {
				places_changed: function(searchbox) {
					//console.log("User Location change event fired!");
					$scope.userLocationSearchBox2 = searchbox;
					//console.log(searchbox);
					postalCodeChanged($scope.userLocationSearchBox2);
				}
			},
		}

		$scope.mapSearchBox = {
			template: 'mapSearchBox.tpl.html',
			options: {
				bounds: new google.maps.LatLngBounds($scope.swBounds, $scope.neBounds),
			},
			events: { // Favourite stores changed event
				places_changed: function(searchbox) {
					//console.log("Inside Favourite Stores places changed event");
					$scope.$apply(); // This applies the options.bounds settings to the searchbox

					var user;
					//alert("SCOPE.MARKERS IS THIS LONG: " + $scope.mapMarkers.length);
					$scope.mapMarkers.forEach(function (marker) {
						if (marker.id == "userLocationMarker"){ 
							//alert("CLEARING OLD STORE MARKER");
							//$scope.mapMarkers.splice($scope.mapMarkers.indexOf(marker),1);
							user = marker;
							return;
						}
					});
					$scope.mapMarkers = [user];

					$scope.places = searchbox.getPlaces();

					if($scope.places.length == 0){
						return;
					} else {
						//console.log("Inside favourite stores function!");


						$scope.favouriteStoresCount = 0;

						var createFavStoreMarker = function (i,bounds, lat, lng, idKey, postalCode, fullName, fullAddress){
							if (idKey == null){
								idKey = "id";
							}

							var latitude = lat;
							var longitude = lng;
							var ret = {
								latitude: latitude, 
								longitude: longitude, 
								title: postalCode + "_" + i,
								postalCode: postalCode,
								fullName: fullName, 
								fullAddress: fullAddress
							};
							ret[idKey] = i;
							return ret;
						};

						$scope.places.forEach(function(place){
							//console.log("inside $scope.places.forEach");
							//console.log(place);

							var request = {
								placeId: place.place_id,
							}

							if (place.types.indexOf("grocery_or_supermarket") == -1){
								return;
							}

							var service = new google.maps.places.PlacesService($scope.actualMapObj);
							service.getDetails(request, callback);

							function callback(results, status) {
								if (status === google.maps.places.PlacesServiceStatus.OK) {
									var stop = false;

									console.log(results);
									results.address_components.forEach(function(category){
										console.log()
										category.types.forEach(function(type){
											if (type == "postal_code") {
												console.log(category.long_name);

												$scope.postalCode = category.long_name.trim().replace(' ', '');
												if ($scope.postalCode.length != 6) {
													alert ("UNEXPECTED POSTAL CODE FOR STORE " + place.name + ":"+$scope.postalCode);
												}
												$scope.fullName = place.name;
												$scope.fullAddress = place.formatted_address;
												console.log($scope.fullAddress);
												console.log($scope.postalCode);

												var result = Stores.findOne({"code": $scope.postalCode});
												if ( result == null || result == undefined)
												{
													return; 
												} 

												$scope.mapMarkers.push(createFavStoreMarker($scope.favouriteStoresCount, $scope.map.bounds, place.geometry.location.lat(), place.geometry.location.lng(), null, $scope.postalCode, place.name, place.formatted_address));
												$scope.markers = [];
												$scope.markers = $scope.mapMarkers; 

				
												$scope.$apply();

												$scope.favouriteStoresCount += 1;
												stop = true;
												return;
											}
										});
										if (stop)  {
											return;
										}
									});

								}
							}
						});

					}

				}
			},
		}


		google.maps.event.trigger($scope.map, 'resize');
	}
	showShoppingLists(){
		this.showMeShoppingLists = !this.showMeShoppingLists;
	};
	showFavStores(){
		this.showMeFavStores = !this.showMeFavStores;
	};
	showMap(){
	      //this.showMeMap = !this.showMeMap;
	  };
	  reset () {
	  	this.searchText = '';
	  	this.showMe = false;
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
	  distanceChange() {
	  		this.scope.maxDistance = this.maxDistance; 
	  };
	  change(){
	  	//console.log("Search text typed in");
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
	  	//console.log(storeId);
	  	var userId = Meteor.user()._id;
	  	var response = addFavStore(postalCode, storeFran,storeId,userId);
	  	this.reset();
	  };
	  addItemToFavs(){
	  	var itemName = this.searchText;
	  	try {
	  		var itemId = Items.findOne({"name":itemName})._id;
		  	//console.log(itemId);
		  	var userId = Meteor.user()._id;
		  	var response = addFavItem(itemName,itemId,userId);
		  }
		  catch (e) {

		  }
		  this.reset();
		};
		addToShoppingList(){
			var itemName = this.searchText;
			var itemId = Items.findOne({"name":itemName})._id;
	  	//console.log(itemId);
	  	var userId = Meteor.user()._id;
	  	addToShoppingList (itemName, itemId, userId);        
	  	this.reset();
	  };
	  getPrice () {
	  	var itemName = unifyText(this.searchText);
	  	console.log("ITEM NAME:"+itemName);
	  	var itemObj = Items.findOne({"name":itemName});
	  	var itemId = itemObj._id;
	  	var itemdata = itemObj.data;
	  	var distance = parseInt(this.maxDistance)	;
	  	var franchises = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];
	  	var userLocation = Session.get('location');
	  	//console.log("USER LOCATION:"+JSON.stringify(userLocation));
	  	if (userLocation == undefined || userLocation == null) {
			//alert ("Could not get your location, proceeding globally");
			userLocation = '';
		}
		//console.log("getting prices:"+itemId+":"+JSON.stringify(itemdata)+":"+distance+":"+JSON.stringify(franchises)+":"+userLocation);
		var priceObjArray = getPrice (itemId, itemdata, distance, franchises, userLocation);
		
		//console.log(priceobj);
		//console.log("BEST PRICE FINAL:"+ bestPrice);

		//console.log(position);
		//console.log("This.scope", this.scope);

		this.scope.mapMarkers.forEach(function (marker) {
			if (marker.id == "userLocationMarker"){ 
				user = marker;
				return;
			}
		});
		this.scope.mapMarkers = [user];

		this.itemCards = [];
		for (var m=0; m < priceObjArray.length; m++) {
			var priceobj = priceObjArray[m];
			//console.log("PRICE OBJ:"+JSON.stringify(this.price));
			var bestPrice = priceobj.price;
			var position = {
				lat: priceobj.lat,
				lng: priceobj.lng
			};

			position.name = priceobj.storename;
			position.postalCode = priceobj.postalcode;
			position.address = priceobj.storeaddress;

			this.setStoreOnMap (m, priceobj.storename , this.setDestinationIcon(priceobj.storename), position);
			//console.log("creating item card");
			var itemCard = {
				"price":priceobj.price,
				"storename":priceobj.storename,
				"fulladdress":priceobj.storeaddress,
				"storeaddress":priceobj.storeaddress.substring(0,priceobj.storeaddress.indexOf(',')),
				"postalCode":priceobj.postalcode,
				"lat":position.lat,
				"lng":position.lng,
				"image": "/storeImages/"+priceobj.storename.trim().replace(' ','')+".jpg",
				"name":itemName
			};
			console.log("CARD:",itemCard);
			this.itemCards.push(itemCard);
		}

		this.hasCards = true;
		//console.log("FROM GETPRICE, THIS.USERLOCATIONMARKER");
		//console.log(this.scope.userLocationMarker);

		//console.log("FROM GETPRICE, THIS.SCOPE.MARKERS:");
		//console.log(this.scope.markers);
		//alert ("You can get "+itemObj.name+" for "+bestPrice+" at the "+priceobj.storename+" on "+priceobj.storeaddress+"!");
	};
	
	setStoreOnMap(i, franchise, icon, position){
		//console.log("Inside setStoreOnMap function");
		//console.log(franchise + i.toString());
		var existingStoreMarkerInfo = {
			id: franchise + i.toString(),
			latitude: position.lat,
			longitude: position.lng,
			icon: icon,
			fullName: position.name,
			fullAddress: position.address,
			postalCode: position.postalCode
		}

		this.scope.mapMarkers.push(existingStoreMarkerInfo);
		return existingStoreMarkerInfo; 
	};
	setDestinationIcon(franchise){
		if(franchise == "Food Basics") {	
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=FB|008000|FFFF00';
		}
		else if (franchise == "Sobeys") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=SB|FFFFFF|000000';
		}
		else if (franchise == "Zehrs") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=ZH|FF6600|000000';
		}
		else if (franchise == "FreshCo") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=FC|000000|FFFFFF';
		}
		else if (franchise == "NoFrills") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=NF|FFFF00|FF0000';
		}
		else if (franchise == "Loblaws") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=LB|CD4000|FFFFFF ';
		}
	}
}

export default angular.module('dashboard',[
   'uiGmapgoogle-maps','angular-meteor',utilsPagination]) //['uiGmapgoogle-maps', 'angular-meteor']
.component('dashboard',{
	template,
	controllerAs: 'dashboard',
	controller: dashboard
})
.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
	'ngInject';
	GoogleMapApi.configure({
		key: 'AIzaSyDh0l5cQZ7pbUBfKCwviFH-P9KAffzhFzo',	
		libraries: 'places'
	});
}])
.config(config)
.directive('checkList', function(){
	return {
		scope: {
			list: '=checkList',
			value: '@'
		},
		link: function(scope, elem, attrs){
			var handler = function(setup){
				var checked = elem.prop('checked');
				var index = scope.list.indexOf(scope.value);

				if (checked && index == -1){
					if (setup) elem.prop('checked', false);
					else scope.list.push(scope.value);
				} else if (!checked && index != -1){
					if (setup) elem.prop('checked', true);
					else scope.list.splice(index, 1);
				}
			};

			var setupHandler = handler.bind(null,true);
			var changeHandler = handler.bind(null, false);

			elem.on('change', function(){
				scope.$apply(changeHandler);
			});
			scope.$watch('list', setupHandler, true);
		}
	};
})
.run(['$templateCache', function ($templateCache) {
	$templateCache.put('searchBoxUserLocation.tpl.html', '<input id="pac-input" type="text" ng-model="ngModel" placeholder = "userLocation">');
}]);

function config($stateProvider) {
	'ngInject';

	$stateProvider.state('dashboard', {
		url: '/dashboard',
		template: '<dashboard></dashboard>',
	});
};