import { Stores } from '../imports/api/stores/index';
//import { Items } from '../imports/api/items/index';
import latLngDistanceCalculator from './latLngDistanceCalculator.js';
export default function getRelevantStores(userLocation, franchises, maxDistance, roughLatDifference, roughLngDifference) {
    console.log("getting relevant stores");

    var relevantStoresToSearch = [];
    var i = 0;
    var storescursor = Stores.find(); 

    storescursor.forEach(function (storeInDatabase) {
        try {
        
        if (franchises.indexOf(storeInDatabase.franchise) < 0) {
            console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 1st test");
            return;
            }
        
        if (Math.abs((Math.abs(userLocation.lat) - Math.abs(storeInDatabase.lat))) > roughLatDifference || Math.abs((Math.abs(userLocation.lng) - Math.abs(storeInDatabase.lng))) > roughLngDifference){
          console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 2nd test");
          return;
        }

        var straightLineDistance = latLngDistanceCalculator(userLocation.lat, userLocation.lng, storeInDatabase.lat, storeInDatabase.lng)
        if ( straightLineDistance > maxDistance){
            console.log("Store " + storeInDatabase.franchise + " at " + storeInDatabase.code + " Failed the 3rd test");
            return;
        }

        relevantStoresToSearch.push(storeInDatabase);
        }
        catch (e) {
            console.log("Something is wrong with store:"+storeInDatabase._id+e);
        }
    });
    return relevantStoresToSearch;
}
