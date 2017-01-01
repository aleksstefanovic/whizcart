export default function addStoreItem(postalCode, storeFran, storeId, userId) {
    console.log("Adding to fav stores...");
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
	else if (userProfile.favStores.indexOf(storeId) > -1){
        return false;
	}
    userProfile.favStores.push(storeId);
    Meteor.users.update({"_id":userId}, {$set:{"profile":userProfile}});
    return true;
}
