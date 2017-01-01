import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { Items } from './collection';
 
if (Meteor.isServer) {
  Meteor.publish('items', function(options, searchString) {
    const selector = 
    {};

    if (typeof searchString === 'string' && searchString.length) {
      selector.name = {
        $regex: `.*${searchString}.*`,
        $options : 'i'
      };
    }
    
    Counts.publish(this, 'numberOfItems', Items.find(selector), {
      noReady: true
    });
    return Items.find(selector, options);
  });
}