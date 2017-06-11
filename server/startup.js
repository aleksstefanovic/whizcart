import { Meteor } from 'meteor/meteor';
import { Items } from '../imports/api/items/index';
import { ChildItems } from '../imports/api/childItems/index';
import { Stores } from '../imports/api/stores/index';
import getPrice from '../scripts/getPrice.js';
import sendEmail from '../scripts/sendEmail.js';
import addFavStore from '../scripts/addFavStore.js';
import convertToString from '../scripts/convertToString.js';
import addFavItem from '../scripts/addFavItem.js';
import unifyText from '../scripts/unifyText.js';

Meteor.startup(() => {
     process.env.MAIL_URL = "smtp://whizzkart@gmail.com:GeneralPhnksSabetMan@smtp.gmail.com:587";

     Meteor.methods({

      sendEmail(body, userId) {
        this.unblock();
        sendEmail(body, userId);
      },

      getPrice(itemId, itemprices, distance, franchises, userLocation) {
        this.unblock();
        var priceObj = getPrice (itemId, itemprices, distance, franchises, userLocation);
        return priceObj;
      },

      logToConsole (text) {
        this.unblock();
        console.log(text);
      },

      addFavStore (postalCode, storeFran, storeId, userId) {
        this.unblock();
        var result = addFavStore(postalCode, storeFran, storeId, userId);  
        return result;
      },

      convertToString (str) {
        this.unblock();
        var convertedString = convertToString (str); 
        return convertedString;
      },

      addFavItem (itemName, itemId, userId) {
        this.unblock();
        var result = addFavItem (itemName, itemId, userId);
        return result;
      },

      unifyText (text) {
        this.unblock();
        var result = unifyText (text);
        return result;
      }

    });
});
