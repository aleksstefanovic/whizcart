export default function getCustFavs (customerId) {

    var favItems = Customers.findOne({"_id":id}).favitems;
    for (var i = 0; i < favItems.length; i++) {
   	var itemrecord = Items.findOne({"name":favItems[i].name});
	var itemId = itemrecord._id;
	var itemprices = itemrecord.data;
	var price, storename, storeaddress;
	if (itemId != null) {
		var storeids = getStores ();			
        console.log ("Going to get best price:"+itemId + "," + storeids);
		var position = getBestStorePrice (itemId, storeids);
		if (position >= 0) {
			price = itemprices[position].prices.current_price;
			var storedata = Stores.findOne ({"_id":itemprices[position].location});
			storename = storedata.franchise;
			storeaddress = storedata.address;
			alert ("You can get "+favItems[i].name+" for $"+price+" at the "+storename+" at "+storeaddress+"!");
		}
		else {
			console.log("Could not find price");
		}
	}
	else {
		console.log("Item does not exist");
	}

    }
}
