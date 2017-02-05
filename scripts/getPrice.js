import { Stores } from '../imports/api/stores/index';
import getStores from './getStores.js';
import getBestStorePrice from './getBestStorePrice.js';
export default function getPrice (itemId,itemprices,distance,franchises, userLocation) {
    console.log("lets get those prices");
    /*var itemrecord = this.item;
	var itemId = itemrecord._id;
	var itemprices = itemrecord.data;*/
	var price, storename, storeaddress, lat, lng;
    //var distance = 10;
    try {
	if (itemId != null) {
		var storeids = getStores (distance, franchises, userLocation);			
        console.log ("Going to get best price:"+itemId + "," + storeids);
		var position = getBestStorePrice (itemId, storeids);
		if (position >= 0) {
			price = itemprices[position].prices.current_price;
			var storedata = Stores.findOne ({"_id":itemprices[position].location});
			storename = storedata.franchise;
			storeaddress = storedata.code;
            lat = storedata.lat;
            lng = storedata.lng;
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
    return {"price":price,"storename":storename,"storeaddress":storeaddress, "lat":lat, "lng":lng};
}