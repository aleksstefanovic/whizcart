import { Items } from '../imports/api/items/index';
import binarySearch from './binarySearch.js';

export default function getBestStorePrice (itemid, storeids) {
	console.log("Getting best price...");
	var position;
	var price = -1;
	var itemrecord = Items.findOne({"_id":itemid}).data;
	for (var i=0; i < storeids.length; i++) {
		console.log("Needle for binary search:"+storeids[i]);
		var pos = binarySearch (itemrecord, storeids[i]);
		console.log("Returned by binary search:"+pos);
        var itemobj = itemrecord[pos];
        if (itemobj != undefined) {
            var newprice = itemobj.prices.current_price;
            if (newprice < price || price === -1) {
                price = newprice;
                position = pos;
            }
        }
	}
	console.log("Got best price...:"+position);
	return position;
}

