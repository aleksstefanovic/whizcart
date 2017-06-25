import angular from 'angular';
import angularMeteor from 'angular-meteor';
import 'angular-simple-logger';
import 'angular-google-maps';
import uiRouter from 'angular-ui-router';
import template from './dashboard.html';
import { Meteor } from 'meteor/meteor'; 
import {Items} from '../../../api/items/index';
import {ChildItems} from '../../../api/childItems/index';
import {Stores} from '../../../api/stores/index';
import utilsPagination from 'angular-utils-pagination';
import { Counts } from 'meteor/tmeasday:publish-counts';
import './dashboard.css';

class dashboard {
	constructor($scope, $rootScope, $compile, $timeout, $reactive) {
		'ngInject'; 
		$reactive(this).attach($scope);
		this.scope = $scope;
        this.specialstyle = null;
        this.showIssueBox = false;
        this.issueBoxText = "";
		this.subscribe('stores');
		this.subscribe('items');
		this.subscribe('childitems');
		this.perPage = 10;
		this.results = [];
		this.page = 1;
		this.sort = {
			name: 1
		};
		this.sort2 = {
			code: 1
		};
		this.sort3 = {
			code: 1
		};
		this.sort4 = {
			code: 1
		};
		this.sort5 = { // didn't fully understand this part either. 
			name: 1
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

        if (Meteor.isCordova) {
            if (device.platform == "Android") {
                this.specialstyle = "styles/dashboard-android.css";  
                //alert("android version");
            }
        }
        else {
            //alert("web version");
        }

		this.helpers(
		{
			items() { 
				var itemCursor = Items.find({ 
					"name": {
						$regex: `.*${this.getReactively('searchText')}.*`,
						$options : 'i'}
					},{sort : this.getReactively('sort')});
				var categoryCursor = Items.find({
					"category": {
						$regex: `.*${this.getReactively('searchText')}.*`,
						$options : 'i'}
					},{sort : this.getReactively('sort5')});
				var storeCursor = Stores.find({
					"code": {
						$regex: `.*${this.getReactively('searchText')}.*`,
						$options : 'i'}
					},{sort : this.getReactively('sort2')});
				/*var storeFranchiseCursor = Stores.find({
					"franchise": {
						$regex: `.*${this.getReactively('searchText')}.*`,
						$options : 'i'}
					},{sort : this.getReactively('sort3')});*/
				var storeAddressCursor = Stores.find({
					"address": {
						$regex: `.*${this.getReactively('searchText')}.*`,
						$options : 'i'}
					},{sort : this.getReactively('sort4')});
				var result = [];
				itemCursor.forEach ( function(item) {
					item.type = 'item';
					result.push(item);
				});
				categoryCursor.forEach(function(item, category){
					item.type = 'category'; // Didn't fully understand this part
					result.push(item);
				})
				storeCursor.forEach ( function(store) {
					store.type = 'store';
					result.push(store);
				});
				/*storeFranchiseCursor.forEach ( function(store) {
					store.type = 'store';
					result.push(store);
				});*/
				storeAddressCursor.forEach ( function(store) {
					store.type = 'store';
					result.push(store);
				});
                //alert(result);
                this.results = result;
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
            		try {
            			var itemObj = ChildItems.findOne({"_id":shoppingList[i]});
	            		var parentItemObj = Items.findOne({"_id":itemObj.parentId});
	            		var storeObj = Stores.findOne({"_id":itemObj.location});
	            		if (itemObj != undefined && storeObj != undefined) {
	            			var obj = {"item":itemObj,"store":storeObj, "parentItem":parentItemObj};
	            			shoppingListData.push(obj);
	            		}
	            	}
	            	catch (e) {
	            		Meteor.call('logToConsole',"ERROR:"+e);
	            		Meteor.call('logToConsole',"ERROR:"+e);
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
            		var itemObj = Items.findOne({"_id":favItems[i]});
            		if (itemObj != undefined) {
            			favItemData.push(itemObj);
            		}
            	}
            	return favItemData;
            },
            isLoggedIn() {
            	return !!Meteor.user();
            }
        }
        );

$scope.showMap = true;

		$scope.allFranchisesInSmartCart = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];
		$scope.checked_stores = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills"];


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
					});
				},


				mouseout: function(map){
					$scope.map.options.scrollwheel = false;
				},

				bounds_changed: function(map) {

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
					//Meteor.call('logToConsole', $scope.mapMarkers);
					$scope.$apply();
				},
			}
		};

		$scope.onClick = function(marker, eventName, model) {

			if (marker.key == "userLocationMarker"){
				return 
			}


			var lng, lat;

			$scope.mapMarkers.forEach(function(mapMarker) {
				if (marker.key == mapMarker.id) {
					$scope.fullName = mapMarker.fullName;
					$scope.fullAddress = mapMarker.fullAddress;
					$scope.postalCode = mapMarker.postalCode;
					lat = mapMarker.latitude;
					lng = mapMarker.longitude;
					return;
				}
			});


			$scope.favouritesButtonClicked = function() {
				var postalCode = $scope.postalCode;
				var storeObj = Stores.findOne({"code":postalCode});

				var storeId = storeObj._id;
				var storeFran = storeObj.franchise;
				var userId = Meteor.user()._id;
				var response = Meteor.call('addFavStore', postalCode, storeFran,storeId,userId);
			}

			model.show = !model.show;
			$scope.activeModel = model;
		};  

		$('.angular-google-map-container').click(function(){
			$scope.map.options.scrollwheel = true;
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
			var userLocationMarkerInfo = {
				id: "userLocationMarker", 
				latitude: 43.659,
				longitude: -79.397,
				icon: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=0|FFFF00|000000'
			}	
			$scope.userLocation = {
				lat: 43.659,
				lng: -79.397
			}
            $scope.mapMarkers.push(userLocationMarkerInfo);
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
				Meteor.call('logToConsole', "User location not found!");
				return;
			}
			else{

				$scope.map.center = $scope.places[0].geometry.location;

				$scope.userLocation = {
					lat: parseFloat($scope.places[0].geometry.location.lat().toFixed(5)),
					lng: parseFloat($scope.places[0].geometry.location.lng().toFixed(5))
				}


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
					$scope.userLocationSearchBox2 = searchbox;
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
					$scope.$apply(); // This applies the options.bounds settings to the searchbox

					var user;
					$scope.mapMarkers.forEach(function (marker) {
						if (marker.id == "userLocationMarker"){ 
							user = marker;
							return;
						}
					});
					$scope.mapMarkers = [user];

					$scope.places = searchbox.getPlaces();
                    alert("Places " + JSON.stringify(searchbox.getPlaces()));

					if($scope.places.length == 0){
						return;
					} else {


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

									Meteor.call('logToConsole', results);
									results.address_components.forEach(function(category){
										category.types.forEach(function(type){
											if (type == "postal_code") {
												Meteor.call('logToConsole', category.long_name);

												$scope.postalCode = category.long_name.trim().replace(' ', '');
												if ($scope.postalCode.length != 6) {
													alert ("UNEXPECTED POSTAL CODE FOR STORE " + place.name + ":"+$scope.postalCode);
												}
												$scope.fullName = place.name;
												$scope.fullAddress = place.formatted_address;
												Meteor.call('logToConsole', $scope.fullAddress);
												Meteor.call('logToConsole', $scope.postalCode);

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
	  	this.updateDashboardOldSearchText();
	  };
        submitIssue () {
            this.showIssueBox = true;
        };
        sendIssue () {
            var userId = Meteor.user()._id;
            var emailBody = this.issueBoxText;
            this.issueBoxText = "Sending message...";
            Meteor.call('sendEmail', emailBody, userId);
            this.issueBoxText = "Message sent!";
            this.issueBoxText = "";
            this.showIssueBox = false;
        };
        cancelIssue () {
            this.issueBoxText = "";
            this.showIssueBox = false;
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
        var userId = Meteor.user()._id;
        var response = Meteor.call('addFavStore', postalCode, storeFran,storeId,userId);
	  	this.reset();
	  };
	  addItemToFavs(){
            var itemName = this.searchText;
	  		var itemId = Items.findOne({"name":itemName})._id;
		  	var userId = Meteor.user()._id;
		  	Meteor.call('addFavItem', itemName,itemId,userId);
            this.reset();
		};
		addToShoppingList(childItemId){
            var userId = Meteor.user()._id;
            addToShoppingList (childItemId, userId);      
            this.reset();
          };
	  updateFranchises (store) {
	  	try {
	  		Meteor.call('logToConsole', "STORE: "+store);
	  		var currentFranchises = this.scope.checked_stores;
	  		var newFranchises = currentFranchises;
	  		var position = currentFranchises.indexOf(store);
	  		if (position > -1) {
	  			newFranchises.splice(position, 1);
	  		}
	  		else {
	  			newFranchises.push(store);
	  		}

	  		this.scope.checked_stores = newFranchises;
	  		this.updateDashboardOldSearchText (); 
	  	}
	  	catch (e) {
	  		console.error(e);
	  	}
	  };
	  updateDashboardNewSearchText () {
	  	if (this.results.length == 1) {
	  		if (this.results[0].type == 'item') {
	  			Meteor.call('convertToString', this.results[0].name, (error, result) => {
                    this.searchText = result;
                    this.oldSearchText = this.results[0].name;
                    this.getPrice (this.oldSearchText);
                });
	  		}
	  		else if (this.results[0].type == 'store') {
	  			Meteor.call('convertToString', this.results[0].address, (error, result) => {
                    this.searchText = result;
                    this.oldSearchText = this.results[0].code;
                    this.getStore (this.oldSearchText);
                });
	  		}
	  	}
	  	else if (this.results.length == 0) {
            var result = this.getStore (this.searchText);
            this.oldSearchText = this.searchText;
	  	}
	  };
	  updateDashboardOldSearchText () {
	  	//alert("Inside updateDashboardOldSearchText");
        if (this.oldSearchText) {
            //this.getPrice(this.oldSearchText);
        }
	  };

	 getStore (searchQuery) {
	  	//alert (searchQuery);
        var service = new google.maps.places.PlacesService(this.scope.actualMapObj);
        var userLocation = new google.maps.LatLng(this.scope.mapMarkers[0].latitude, this.scope.mapMarkers[0].longitude);
        var request = {
            "query":searchQuery,
            "location":userLocation,
            "radius": 10
        };
        service.textSearch(request, callback);

        var ngObj = this;
        function callback(results, status) {
        	alert(status);
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                Meteor.call('logToConsole', JSON.stringify(results));

                ngObj.scope.mapMarkers.forEach(function (marker) {
                    if (marker.id == "userLocationMarker"){ 
                        user = marker;
                        return;
                    }
                });
                ngObj.scope.mapMarkers = [user];

                var storeObj = Stores.findOne({"code":searchQuery});
                var storename = null;
                var position = {};
                if (storeObj) {
                    storename = storeObj.franchise;
                    position.name = storename;
                    position.postalCode = storeObj.code;
                    position.address = storeObj.address;
                }

                for (var i=0; i < results.length; i++) {
                    var place = results[i];
                    if (!storeObj) {
                        storename = place.name;
                        position.name = storename;
                        var postalText = place.formatted_address.split(",")[2];
                        position.postalCode = postalText.split(" ")[2] + postalText.split(" ")[3]
                        position.address = place.formatted_address;
                    }
                    position.lat = place.geometry.location.lat();
                    position.lng = place.geometry.location.lng();

                    ngObj.setStoreOnMap (i, storename, ngObj.setDestinationIcon(storename), position);
                    if (i === 10) {
                        break;
                    }
                }
                ngObj.hasCards = false;
                ngObj.scope.$apply();
            }
        };
	  };

	  getPrice (searchQuery) {		
	  	Meteor.call('unifyText', searchQuery, (error, result) => {
            var itemName = result;

            Meteor.call('logToConsole',"ITEM NAME:"+itemName);
            var itemObj = Items.findOne({"name":itemName});
            var itemId = itemObj._id;
            var itemdata = itemObj.data;
            var distance = parseInt(this.maxDistance);
            Meteor.call('logToConsole',"DISTANCE IS " + distance);
            var franchises = this.scope.checked_stores;
            var userLocation = this.scope.userLocation;
            if (userLocation == undefined || userLocation == null) {
                alert ("Could not get your location, proceeding globally");
                userLocation = '';
            }

            Meteor.call('getPrice', itemId, itemdata, distance, franchises, userLocation, (error, result) => {
                var priceObjArray = result;
                if (priceObjArray) {
                    var user;
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
                        var bestPrice = priceobj.price;
                        var position = {
                            lat: priceobj.lat,
                            lng: priceobj.lng
                        };

                        position.name = priceobj.storename;
                        position.postalCode = priceobj.postalcode;
                        position.address = priceobj.storeaddress;

                        this.setStoreOnMap (m, priceobj.storename , this.setDestinationIcon(priceobj.storename), position);

                        var imageName;
                        if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("BASICS")){
                            imageName ="FoodBasics";
                        } 
                        else if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("FRESHCO"))
                        {
                            imageName = "FreshCo"
                        }
                        else if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("LOBLAW"))
                        {
                            imageName = "Loblaws"
                        }
                        else if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("FRILLS"))
                        {
                            imageName = "NoFrills"
                        }
                        else if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("SOBEY"))
                        {
                            imageName = "Sobeys"
                        }
                        else if (priceobj.storename.trim().replace(' ','').toUpperCase().contains("ZEHRS"))
                        {
                            imageName = "Zehrs"
                        }

                        var itemCard = {
                            "price":priceobj.price,
                            "storename":priceobj.storename,
                            "fulladdress":priceobj.storeaddress,
                            "storeaddress":priceobj.storeaddress.substring(0,priceobj.storeaddress.indexOf(',')),
                            "postalCode":priceobj.postalcode,
                            "lat":position.lat,
                            "lng":position.lng,
                            "image": "/storeImages/"+imageName+".jpg",
                            "childId":priceobj.childId,
                            "name":itemName
                        };
                        Meteor.call('logToConsole',"CARD:",itemCard);
                        this.itemCards.push(itemCard);
                    }
                    this.scope.$apply();
                    this.hasCards = true;
                }
                else {
                    alert("Could not find price");
                }
            });
        });
	};
	
	setStoreOnMap(i, franchise, icon, position){
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
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=LB|CD4000|FFFFFF	 ';
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
