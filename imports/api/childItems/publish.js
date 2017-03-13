import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { ChildItems } from './collection';
 
if (Meteor.isServer) {
  Meteor.publish('childitems', function(options, searchString) {
    const selector = 
    {};

    if (typeof searchString === 'string' && searchString.length) {
      selector.name = {
        $regex: `.*${searchString}.*`,
        $options : 'i'
      };
    }
    
    Counts.publish(this, 'numberOfItems', ChildItems.find(selector), {
      noReady: true
    });
    return ChildItems.find(selector, options);
  });
}
