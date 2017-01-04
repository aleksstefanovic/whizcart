import angular from 'angular';
import angularMeteor from 'angular-meteor';
import 'angular-simple-logger';
import 'angular-google-maps';
import uiRouter from 'angular-ui-router';
import template from './appMaps.html';
import { Meteor } from 'meteor/meteor'; 
import {Stores} from '../../../api/stores/index';
import './appMaps.css';
import getRelevantStores from '../../../../scripts/getRelevantStores.js';
import addFavStore from '../../../../scripts/addFavStore.js';

class appMaps {
	constructor($scope, $rootScope, $compile, $timeout) {
		'ngInject'; 
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
		$scope.favStoreMarkers = [];
		$scope.userLocationMarker = [];
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
				options: {} 
			}, 
			events: {
				bounds_changed: function(map) {
					console.log("Map bounds_Changed event fired!");
					$scope.bounds = map.getBounds();
					$scope.ne = $scope.bounds.getNorthEast();
					$scope.sw = $scope.bounds.getSouthWest();
					$scope.searchBoxFavouriteStores.options.bounds = new google.maps.LatLngBounds($scope.sw, $scope.ne);

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
			$scope.userLocationMarker = markers;

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

		$("#chkBoxFoodBasics").change(function(){
			if (this.checked){
				$scope.franchises.push("Food Basics");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "Food Basics");
			}
			console.log("Franchises: " + $scope.franchises);
		});


		$("#chkBoxSobeys").change(function(){
			if (this.checked){
				$scope.franchises.push("Sobeys");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "Sobeys");
			}
			console.log("Franchises: " + $scope.franchises);
		});

		$("#chkBoxZehrs").change(function(){
			if (this.checked){
				$scope.franchises.push("Zehrs");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "Zehrs");
			}
			console.log("Franchises: " + $scope.franchises);
		});

		$("#chkBoxFreshCo").change(function(){
			if (this.checked){
				$scope.franchises.push("FreshCo");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "FreshCo");
			}
			console.log( "Franchises: " + $scope.franchises);
		});

		$("#chkBoxNoFrills").change(function(){
			if (this.checked){
				$scope.franchises.push("NoFrills");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "NoFrills");
			}
			console.log("Franchises: " + $scope.franchises);
		});

		$("#chkBoxSoren").change(function(){
			if (this.checked){
				$scope.franchises.push("Soren");
				console.log("Franchises: " + $scope.franchises);
				postalCodeChanged($scope.userLocationSearchBox2);
			}
			else if(!this.checked){
				arrayRemove($scope.franchises, "Soren");
			}
			console.log("Franchises: " + $scope.franchises);
		});

		function arrayRemove(array, item){
			console.log($scope.existingStoreMarkers);
			var i;
			var index = array.indexOf(item);
			if(index !=-1){
				array.splice(index,1);
			}
			var franchiseReturnCode = setFranchiseReturnCode(item);

			for (i = $scope.existingStoreMarkers.length - 1; i >= 0; i--) {
				if ($scope.existingStoreMarkers[i].id.includes(franchiseReturnCode)){
					$scope.existingStoreMarkers.splice(i,1);
				}
			}
			$scope.$apply();
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

		function setDestinationIcon(franchise){
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

		function setStoreOnMap(i, franchise, icon, position){
			console.log("Inside setStoreOnMap function");
			console.log(franchise + i.toString());
			var existingStoreMarkerInfo = {
				id: franchise + i.toString(),
				latitude: position.lat,
				longitude: position.lng,
				icon: icon
			}

			markers.push(existingStoreMarkerInfo);
			$scope.existingStoreMarkers = markers; 
		}

		function postalCodeChanged(searchbox){
			$scope.favStoreMarkers.length = 0;  	
			$scope.userLocationMarker.length = 0;
			$scope.existingStoreMarkers.length = 0;
			$scope.returnPostalCodes = []; 
			if ($scope.activeModel){
				$scope.activeModel.show = false;
			}

			$scope.places = searchbox.getPlaces();

			if($scope.places.length == 0){
				console.log("User location not found!");
				return;
			}
			else{
				console.log("Succesfully found user location!");

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

				markers.push(userLocationMarkerInfo);
				$scope.userLocationMarker = markers;

				$scope.markersArray = [];
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
				});
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
					postalCodeChanged($scope.userLocationSearchBox2);
				}
			},
		}

		$scope.searchBoxFavouriteStores = {
			template: 'searchBoxFavouriteStores.tpl.html',
			options: {
				bounds: new google.maps.LatLngBounds($scope.swBounds, $scope.neBounds),
			},
			events: { // Favourite stores changed event
				places_changed: function(searchbox) {
					console.log("Inside Favourite Stores places changed event");
					$scope.$apply(); // This applies the options.bounds settings to the searchbox

					$scope.userLocationMarker.length = 0;
					$scope.favStoreMarkers.length = 0; // Erases all favourite stores markers on the map 
					$scope.exitingStoreMarkers = 0; // TEMPORARY

					$scope.places = searchbox.getPlaces();

					if($scope.places.length == 0){
						console.log("No store by that name found!")
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

							$scope.favStoreMarkers.push(createFavStoreMarker($scope.favouriteStoresCount, $scope.map.bounds, place.geometry.location.lat(), place.geometry.location.lng()));

							$scope.markers = $scope.favStoreMarkers; 

							$scope.onClick = function(marker, eventName, model) {

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
							};

							$scope.favouriteStoresCount += 1;
						});

						console.log($scope.favStoreMarkers);
					}
				}
			},
		}

		google.maps.event.trigger($scope.map, 'resize');
	}
}

export default angular.module('appMaps',[
   'uiGmapgoogle-maps','angular-meteor']) //['uiGmapgoogle-maps', 'angular-meteor']
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
});

function config($stateProvider) {
	'ngInject';

	$stateProvider.state('appMaps', {
		url: '/appMaps',
		template: '<app-maps></app-maps>',
	});
};




