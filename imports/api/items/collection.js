import { Mongo } from 'meteor/mongo';
 
export const Items = new Mongo.Collection('items');
//export const Customers = new Mongo.Collection('customers');
//export const Stores = new Mongo.Collection('stores');

Items.allow({
  insert(userId, item) {
    return userId && item.owner === userId;
  },
  update(userId, item, fields, modifiers) {
    //return userId && item.owner === userId;
    return true;
  },
  remove(userId, item) {
    return userId && item.owner === userId;
  }
});
