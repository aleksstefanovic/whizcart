import { Items } from '../imports/api/items/index';
import binarySearch from './binarySearch.js';
import binarySort from './binarySort.js';

export default function getBestStorePrice (itemid, storeids) {
	console.log("Getting best price...");
	var positions = [];
	var price = -1;
	var itemrecord = Items.findOne({"_id":itemid}).data;
	itemrecord = binarySort(itemrecord, 'location');
	for (var i=0; i < storeids.length; i++) {
		//	console.log("Needle for binary search:"+storeids[i]);
		//console.log("Item Record:"+JSON.stringify(itemrecord));
		var pos = binarySearch (itemrecord, storeids[i]);
		//console.log("Returned by binary search:"+pos);
        var itemobj = itemrecord[pos];
        //console.log("PUT SOME TEXT IN FRON LIKE:"+itemobj);
        if (itemobj != undefined) {
            //var newprice = itemobj.prices.current_price;
            //price = newprice;
            positions.push(pos);
            /*if (newprice < price || price === -1) {
                price = newprice;
                positions.push(pos);
            }*/
        }
	}
	//console.log("Got best price...:"+position);
	//positions = binarySort(positions);
		console.log("POSITIONS:"+positions);	
	return positions;
}

