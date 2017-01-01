import { Stores } from '../imports/api/stores/index';
//import { Items } from '../imports/api/items/index';
import latLngDistanceCalculator from './latLngDistanceCalculator.js';
export default function getRelevantStores(userLocation, franchises, maxDistance, roughLatDifference, roughLngDifference) {
    console.log("getting relevant stores");
    //Meteor.subscribe('stores');
    //Stores = new Mongo.Collection('stores');
    //Meteor.subscribe('items');
    var relevantStoresToSearch = [];
    var i = 0;
    var storescursor = Stores.find(); 
    //var itemscursor = Items.find().fetch(); 
    //console.log("ITEMS?:"+JSON.stringify(itemscursor));
	//console.log("CURSOR:",storescursor);
    //console.log("STORES?:"+JSON.stringify(storescursor));
    storescursor.forEach(function (storeInDatabase) {
        //console.log("STORES?HERE WE GO");
        try {
        if ($.inArray(storeInDatabase.franchise, franchises) == -1){
            console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 1st test");
            //continue;
            return;
            }
        if (Math.abs((Math.abs(userLocation.lat) - Math.abs(storeInDatabase.lat))) > roughLatDifference || Math.abs((Math.abs(userLocation.lng) - Math.abs(storeInDatabase.lng))) > roughLngDifference){
          console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 2nd test");
          //continue;
          return;
        }
        console.log(JSON.stringify("USER LOCATION:"+userLocation));
        var straightLineDistance = latLngDistanceCalculator(userLocation.lat, userLocation.lng, storeInDatabase.lat, storeInDatabase.lng)
        console.log(straightLineDistance + " - " + maxDistance);
        if ( straightLineDistance > maxDistance){
            console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 3rd test");
            //continue;
            return;
        }
        relevantStoresToSearch.push(storeInDatabase);
        console.log(relevantStoresToSearch);
        }
        catch (e) {
            console.log("Something is wrong with store:"+storeInDatabase._id+e);
        }
    }
    )
    //console.log("STORES?OVER");
		return relevantStoresToSearch;
}
