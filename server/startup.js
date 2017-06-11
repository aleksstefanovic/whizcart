import { Meteor } from 'meteor/meteor';
import { Items } from '../imports/api/items/index';
import { ChildItems } from '../imports/api/childItems/index';
import { Stores } from '../imports/api/stores/index';
import getPrice from '../scripts/getPrice.js';
import sendEmail from '../scripts/sendEmail.js';

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
      }

    });
});
