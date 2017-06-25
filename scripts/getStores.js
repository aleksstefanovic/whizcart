import { Stores } from '../imports/api/stores/index';
import getRelevantStores from './getRelevantStores.js';
export default function getStores (distance, franchise, userLocation) {
    console.log("getting postal array...");
    if (distance == null) {
        distance = 5;
    }
    var postalArray = getStoresGoogleMaps (distance, franchise, userLocation);
	console.log("POSTAL ARRAY RETURNED BY MAPS:" + postalArray);
	var idArray = [];
	for (var i=0; i < postalArray.length; i++) {
	    var storeobj = Stores.findOne ({"code":postalArray[i]});
        if (storeobj != undefined) {
            idArray.push(storeobj._id);
        }
	}
	//alert("ARRAY OF STORE IDs:"+JSON.stringify(idArray));
	return idArray;
}

function getStoresGoogleMaps (distance,franchises, userLocation) {
            var roughLatDifference = 0.1;
            var roughLngDifference = 0.1;
            var postalCodes = [];

            relevantStoresToSearch = getRelevantStores(userLocation, franchises, distance, roughLatDifference, roughLngDifference);
            //alert("Relevant stores:"+JSON.stringify(relevantStoresToSearch));
            for (var i=0; i < relevantStoresToSearch.length; i++) {
                postalCodes.push(relevantStoresToSearch[i].code);
            }


			return postalCodes;
}

