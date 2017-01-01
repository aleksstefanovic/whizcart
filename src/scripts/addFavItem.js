export default function addFavItem(itemName, itemId, userId) {
    var response = {"result":"","message":""};
    if (userId == undefined || userId == null) {
        response.result = false;
        response.message = "No customer signed in";
        return response;
    }
    if (itemId == undefined || itemId == null) {
        response.result = false;
        response.message = "No item id";
        return response;
    }
    var userProfile = Meteor.users.findOne({"_id":userId}).profile;
    console.log("User profile:",JSON.stringify(userProfile));
    if (userProfile == undefined) {
        userProfile = 
        {
            "favItems":[],
            "favStores":[],
            "shoppingLists":[]
        };
    }
	else if (userProfile.favItems.indexOf(itemId) > -1){
        response.result = false;
        response.message = "item already in favs";
        return response;
	}
    userProfile.favItems.push(itemId);
    Meteor.users.update({"_id":userId}, {$set:{"profile":userProfile}});
    response.result = true;
    response.message = "Item added to favourites";
    return response;
}
