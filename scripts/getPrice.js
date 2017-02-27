import { Stores } from '../imports/api/stores/index';
import getStores from './getStores.js';
import getBestStorePrice from './getBestStorePrice.js';
import binarySort from './binarySort.js';
export default function getPrice (itemId,itemprices,distance,franchises, userLocation) {
    console.log("lets get those prices");
    /*var itemrecord = this.item;
	var itemId = itemrecord._id;
	var itemprices = itemrecord.data;*/
	var price, storename, storeaddress, lat, lng, postalcode;
	var priceResults = [];
    //var distance = 10;

    try {
	if (itemId != null) {
		var storeids = getStores (distance, franchises, userLocation);			
        console.log ("Going to get best price:"+itemId + "," + storeids);
		var positions = getBestStorePrice (itemId, storeids);
		if (positions.length != 0) {
		for (var i=0; i < positions.length; i++) {
			price = itemprices[positions[i]].prices.current_price;
			var storedata = Stores.findOne ({"_id":itemprices[positions[i]].location});
			storename = storedata.franchise;
			postalcode = storedata.code;
			storeaddress = storedata.address;
            lat = storedata.lat;
            lng = storedata.lng;
            //console.log("PRICE RESULTS:"+priceResults);
            priceResults.push({"price":price,"storename":storename,"storeaddress":storeaddress, "postalcode":postalcode, "lat":lat, "lng":lng});
        }
			//alert ("You can get it for $"+price+" at the "+storename+" at "+storeaddress+"!");
		}
		else {
			console.log("Could not find price");
			alert ("Could not find price");
            return null;
		}
	}
	else {
		console.log("Item does not exist");
        return null;
	}
    }
    catch (e) {
        console.log("Could not find price:"+e);
        alert ("Could not find price");
        return null;
    }
    //console.log("PRICE RESULTS:",priceResults);
    //console.log("PRICE RESULTS SORTED:",binarySort(priceResults, 'price').slice(0,20));
    return binarySort(priceResults, 'price').slice(0,5);
}