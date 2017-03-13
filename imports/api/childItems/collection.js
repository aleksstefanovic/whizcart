import { Mongo } from 'meteor/mongo';
 
export const ChildItems = new Mongo.Collection('childitems');
//export const Customers = new Mongo.Collection('customers');
//export const Stores = new Mongo.Collection('stores');

ChildItems.allow({
  insert(userId, item) {
    return userId && item.owner === userId;
  },
  update(userId, item, fields, modifier) {
    return userId && item.owner === userId;
  },
  remove(userId, item) {
    return userId && item.owner === userId;
  }
});
