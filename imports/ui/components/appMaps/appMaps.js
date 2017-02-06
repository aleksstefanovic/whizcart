import angular from 'angular';
import angularMeteor from 'angular-meteor';
import 'angular-simple-logger';
import 'angular-google-maps';
import uiRouter from 'angular-ui-router';
import template from './appMaps.html';
import { Meteor } from 'meteor/meteor'; 
import {Items} from '../../../api/items/index';
import {Stores} from '../../../api/stores/index';
import './appMaps.css';
import getRelevantStores from '../../../../scripts/getRelevantStores.js';
import addFavStore from '../../../../scripts/addFavStore.js';
import utilsPagination from 'angular-utils-pagination';
import { Counts } from 'meteor/tmeasday:publish-counts';
import addToShoppingList from '../../../../scripts/addToShoppingList.js';
import addFavItem from '../../../../scripts/addFavItem.js';
import getPrice from '../../../../scripts/getPrice.js';

class appMaps {
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
		this.showMe = false;
		this.helpers(
		{
			items() { 
				console.log("finding matches");
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
    itemsCount() {return Counts.get('numberOfItems');}
}
);

		$scope.subscribe('stores');
		$scope.showMap = true;
		
		console.log("From the constructor inside appMaps.js");
		$scope.allFranchisesInSmartCart = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills", "Soren"];
		$scope.checked_stores = ["Food Basics", "Sobeys", "Zehrs", "FreshCo", "NoFrills", "Soren"];

		$scope.$watch('checked_stores', function(newValue, oldValue, scope){
			console.log("checked_stores Changed!")

			var removed = $(oldValue).not(newValue).get();	// black magic from stack overflow
			var added = $(newValue).not(oldValue).get();

			console.log("Removed: " + removed);
			console.log("Added: " + added);

			if (removed == "" && added != ""){ // If a store was added to the list
				postalCodeChanged($scope.userLocationSearchBox2);
			} 
			else if (removed != "" && added == ""){ // If removed
				console.log("nothing added!");
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
		//$scope.existingStoreMarkers = [];
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

				/*mouseover: function(map){
					console.log("Inside Mouseover");
					$scope.map.options.scrollwheel = false;
					console.log($scope.map.options.scrollwheel);
				},	*/

				mouseout: function(map){
					//console.log("Mouse left map!");
					$scope.map.options.scrollwheel = false;
					//console.log($scope.map.options.scrollwheel);
					console.log($scope.mapMarkers);
					//console.log($scope.existingStoreMarkers);
				},

				bounds_changed: function(map) {
					console.log("Map bounds_Changed event fired!");
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

					$scope.$apply();
				},
			}
		};

		$('.angular-google-map-container').click(function(){
			$scope.map.options.scrollwheel = true;
			console.log($scope.map.options.scrollwheel);
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
			console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
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
			console.log("Check box changed!");
		}

		/*function arrayRemove(array, item){
			console.log($scope.existingStoreMarkers);
			var i;
			var index = array.indexOf(item);
			if(index !=-1){
				array.splice(index,1);
			}
			var franchiseReturnCode = setFranchiseReturnCode(item);

			for (i = $scope.mapMarkers.length - 1; i >= 0; i--) {
				if ($scope.mapMarker[i].id.includes(franchiseReturnCode)){
					$scope.existingStoreMarkers.splice(i,1);
				}
			}
			$scope.$apply();
		}*/

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
			else if (franchise == "Soren") {
				return "SS";
			}
			else if (franchise == "Conestoga Mall") {
				return "CM";
			}
		}


		function postalCodeChanged(searchbox){

			console.log($scope.mapMarkers);
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
				console.log("Succesfully found user location!")

				$scope.map.center = $scope.places[0].geometry.location;

				$scope.userLocation = {
					lat: parseFloat($scope.places[0].geometry.location.lat().toFixed(5)),
					lng: parseFloat($scope.places[0].geometry.location.lng().toFixed(5))
				}

				console.log($scope.userLocation.lat);
				console.log($scope.userLocation.lng);

				var userLocationMarkerInfo = {
					id: "userLocationMarker", 
					latitude: $scope.userLocation.lat,
					longitude: $scope.userLocation.lng,
					icon: 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=0|FFFF00|000000'
				}	

				$scope.mapMarkers.push(userLocationMarkerInfo);

				/*console.log("LINE 368");
				console.log($scope.mapMarkers);

				$scope.roughLatDifference = 0.01 * $scope.maxDistance;
				$scope.roughLngDifference = $scope.maxDistance/(Math.cos((Math.abs($scope.userLocation.lat)*Math.PI/180)) * 111); 
				console.log("ROUGH LAT DIFFERENCE: " + $scope.roughLatDifference);
				console.log("ROUGH LNG DIFFERENCE: " + $scope.roughLngDifference); // Could use taylor series expansion to make it faster if necessary. Could also do that in the other function where  distance calculated

				$scope.relevantStoresToSearch = getRelevantStores($scope.userLocation, $scope.franchises, $scope.maxDistance, $scope.roughLatDifference, $scope.roughLngDifference);
				console.log("RELE:"+JSON.stringify($scope.relevantStoresToSearch));

				populateDestinationArray($scope.relevantStoresToSearch, $scope.destArray);

				var service = new google.maps.DistanceMatrixService;
				
				service.getDistanceMatrix({
					origins: [$scope.userLocation],
					destinations: [$scope.destArray[0], $scope.destArray[1], $scope.destArray[2], $scope.destArray[3], $scope.destArray[4], $scope.destArray[5], $scope.destArray[6], $scope.destArray[7], $scope.destArray[8], $scope.destArray[9], $scope.destArray[10], $scope.destArray[11], $scope.destArray[12], $scope.destArray[13], $scope.destArray[14], $scope.destArray[15], $scope.destArray[16], $scope.destArray[17], $scope.destArray[18], $scope.destArray[19], $scope.destArray[20], $scope.destArray[21], $scope.destArray[22], $scope.destArray[23], $scope.destArray[24]],
					travelMode: $scope.myTravelMode, 
					unitSystem: google.maps.UnitSystem.METRIC,
					avoidHighways: false,
					avoidTolls: false,
				}, function(response, status) {
					if (status != 'OK'){
						console.log("Error was: " + status);
						return "error";
					}
					else{
						var originList = response.originAddresses;
						var destinationList = response.destinationAddresses;
						var results = response.rows[0].elements;

						var destinationIcon;

						for (i = 0; i < response.rows[0].elements.length; i++) {
							try {
								var badErrorChecking = results[i].distance.value;
							}
							catch (e) {
								break;
							}

							destinationIcon = setDestinationIcon($scope.relevantStoresToSearch[i].franchise);
							var franchiseReturnCode = setFranchiseReturnCode($scope.relevantStoresToSearch[i].franchise);

							if ($scope.franchises.length == 0) {
								if (results[i].distance.value/1000 < $scope.maxDistance) {
									setStoreOnMap(i, franchiseReturnCode, destinationIcon, $scope.destArray[i]);
									$scope.returnPostalCodes.push(franchiseReturnCode + $scope.relevantStoresToSearch[i].code);
								}
							}
							else {
								if (results[i].distance.value/1000 < $scope.maxDistance && $scope.franchises.indexOf($scope.relevantStoresToSearch[i].franchise) != -1) {
									setStoreOnMap(i, franchiseReturnCode, destinationIcon, $scope.destArray[i]);
									$scope.returnPostalCodes.push(franchiseReturnCode + $scope.relevantStoresToSearch[i].code);
								}	
							}
						}				
					}
					$scope.$apply();
					console.log($scope.returnPostalCodes);
				});*/

				//oldPlace = $scope.places[0].names
			}
		}

		$scope.maxDistanceChanged = function(){
			if (_timeout) {
				$timeout.cancel(_timeout); // if already a timeout then cancel
			}

			_timeout = $timeout(function(){
				_timeout = null;

				if ($scope.userLocation == null){
					console.log("No user location, cancelling!");
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
					console.log("User Location change event fired!");
					$scope.userLocationSearchBox2 = searchbox;
					console.log(searchbox);
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
					console.log("Inside Favourite Stores places changed event");
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
						console.log("Inside favourite stores function!");


						$scope.favouriteStoresCount = 0;

						var createFavStoreMarker = function (i,bounds, lat, lng, idKey){
							if (idKey == null){
								idKey = "id";
							}

							var latitude = lat;
							var longitude = lng;
							var ret = {
								latitude: latitude, 
								longitude: longitude, 
								title: 'm' + i
							};
							ret[idKey] = i;
							return ret;
						};

						$scope.places.forEach(function(place){
							console.log("inside $scope.places.forEach");
							console.log(place);

							if (place.types.indexOf("grocery_or_supermarket") == -1){
								return;
							}

							$scope.fullName = place.name;
							$scope.fullAddress = place.formatted_address;
							console.log($scope.fullAddress);
							var lastCommaIndex = $scope.fullAddress.lastIndexOf(",");
							$scope.postalCode = $scope.fullAddress.substr(lastCommaIndex-7,7);
							$scope.postalCode = $scope.postalCode.replace(/\s+/g,'');
							console.log($scope.postalCode);

							if (Stores.findOne({"code": $scope.postalCode}) == null)
							{
								return; 
							}

							$scope.mapMarkers.push(createFavStoreMarker($scope.favouriteStoresCount, $scope.map.bounds, place.geometry.location.lat(), place.geometry.location.lng()));
							$scope.markers = $scope.mapMarkers; 




							/*$scope.onClick = function(marker, eventName, model) {

								console.log("Marker Clicked!");
								$scope.fullName = $scope.places[marker.key].name;
								$scope.fullAddress = $scope.places[marker.key].formatted_address;
								console.log($scope.fullAddress);
								var lastCommaIndex = $scope.fullAddress.lastIndexOf(",");
								$scope.postalCode = $scope.fullAddress.substr(lastCommaIndex-7,7);
								$scope.postalCode = $scope.postalCode.replace(/\s+/g,'');

								var lat = $scope.places[marker.key].geometry.location.lat();
								var lng = $scope.places[marker.key].geometry.location.lng();

								$scope.favouritesButtonClicked = function() {
									console.log("FavouritesButtonClicked!",$scope.postalCode);
									var postalCode = $scope.postalCode;
									var storeObj = Stores.findOne({"code":postalCode});
									var storeId = storeObj._id;
									var storeFran = storeObj.franchise;
									console.log(storeId);
									var userId = Meteor.user()._id;
									var response = addFavStore(postalCode, storeFran,storeId,userId);
								}

								$scope.databaseButtonClicked = function() {
									console.log("DatabaseButtonClicked!");
									var postalCode = $scope.postalCode;
									console.log($scope.fullName);
									var franchise = $scope.fullName;
									if (franchise.includes("Zehrs")){
										franchise = "Zehrs";
									} else if (franchise.includes("No Frills")){ 
										franchise = "NoFrills";	
									} else if (franchise.includes("Fresh Co")) {
										franchise = "FreshCo";
									}

									Stores.insert(
									{
										"code":postalCode,
										"franchise":franchise,
										"address":$scope.fullAddress,
										"lat":lat,
										"lng":lng
									}
									);
								}


								model.show = !model.show;
								$scope.activeModel = model;
								console.log($scope.activeModel.show);
							}; */ 

							$scope.favouriteStoresCount += 1;
						})

						console.log($scope.mapMarkers);
					}
				}
			},
		}


		google.maps.event.trigger($scope.map, 'resize');
	}
	change(){
		console.log("Search text typed in");
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
	getPrice () {
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
		console.log(priceobj);
		console.log("BEST PRICE FINAL:"+ bestPrice);
		var position = {
			lat: priceobj.lat,
			lng: priceobj.lng
		};

		console.log(position);

		console.log("This.scope", this.scope);

		this.scope.mapMarkers.forEach(function (marker) {
			if (marker.id == "userLocationMarker"){ 
				user = marker;
				return;
			}
		});
		this.scope.mapMarkers = [user];


		this.setStoreOnMap (0, priceobj.storename ,this.setDestinationIcon(priceobj.storename), position);

		//console.log("FROM GETPRICE, THIS.USERLOCATIONMARKER");
		//console.log(this.scope.userLocationMarker);

		//console.log("FROM GETPRICE, THIS.SCOPE.MARKERS:");
		//console.log(this.scope.markers);
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
	setStoreOnMap(i, franchise, icon, position){
		console.log("Inside setStoreOnMap function");
		console.log(franchise + i.toString());
		var existingStoreMarkerInfo = {
			id: franchise + i.toString(),
			latitude: position.lat,
			longitude: position.lng,
			icon: destinationIcon
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
		else if (franchise == "Soren") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=SS|ABCD00|FF0000';
		}
		else if (franchise == "Conestoga Mall") {
			return 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=NF|FFEE00|FF0000';
		}
	}
}

export default angular.module('appMaps',[
   'uiGmapgoogle-maps','angular-meteor',utilsPagination]) //['uiGmapgoogle-maps', 'angular-meteor']
.component('appMaps',{
	template,
	controllerAs: 'appMaps',
	controller: appMaps
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

	$stateProvider.state('appMaps', {
		url: '/appMaps',
		template: '<app-maps></app-maps>',
	});
};






