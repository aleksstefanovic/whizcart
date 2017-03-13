export default function addToShoppingList (itemId,userId) {
    console.log("adding to shopping list...");
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
    if (userProfile.shoppingLists[0] == undefined) {
        userProfile.shoppingLists[0] = 
        {
            "name":"My Shopping List",
            "items":[]
        };
    }
	else if (userProfile.shoppingLists[0].items.indexOf(itemId) > -1){
        return false;
	}
    userProfile.shoppingLists[0].items.push(itemId);
    Meteor.users.update({"_id":userId}, {$set:{"profile":userProfile}});
}
