import { Meteor } from 'meteor/meteor';
import { Items } from '../imports/api/items/index';
import { ChildItems } from '../imports/api/childItems/index';
import { Stores } from '../imports/api/stores/index';

Meteor.startup(() => {
  /*if (Items.find().count() === 0) {
    const items = [
    	{'name': 'Apples'}, 
    	{'name': 'Oranges'}, 
    	{'name': 'Bannanas'}
    ];
 
    items.forEach((item) => {
      Items.insert(item)
    });
  }*/
  /*if (Stores.find().count() === 0) {
    const store =
	{
	  "_id": "80602b0b-66aa-497d-acce-55483b49d80b",
	  "code": "M4K3W5",
	  "franchise": "Food Basics",
	  "address": "1070 Pape Ave",
	  "description": "Some food basics at pape",
	  "hours": {
		"sunday": "cillum",
		"monday": "sunt consectetur",
		"tuesday": "si",
		"wednesday": "enim ut aliqua",
		"thursday": "qui labor",
		"friday": "proident",
		"saturday": "qui enim"
	  }
	};
 
      Stores.insert(store)
  }*/
     process.env.MAIL_URL = "smtp://whizzkart@gmail.com:GeneralPhnksSabetMan@smtp.gmail.com:587";
     Meteor.methods({
      sendEmail(subject, text) {
        this.unblock();
        console.log(subject, text);
        var email = "whizzkart@gmail.com";
        Email.send({ to:email, from:email, subject:subject, text:text });
      }
    });
});
