import { Meteor } from 'meteor/meteor';
import { Stores } from './collection';
 
if (Meteor.isServer) {
  Meteor.publish('stores', function() {
    return Stores.find();
  });
}
