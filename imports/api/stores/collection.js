import { Mongo } from 'meteor/mongo';
 
export const Stores = new Mongo.Collection('stores');
//export const Customers = new Mongo.Collection('customers');
//export const Stores = new Mongo.Collection('stores');

Stores.allow({
  insert(userId, store) {
    return userId  === userId;
  },
  update(userId, store, fields, modifier) {
    return userId  === userId;
  },
  remove(userId, store) {
    return userId  === userId;
  }
});
