//import{ Items }  from '../lib/collections.js';
import getFirst from './getFirst.js';
export default function getPostalCodes (id) {
  console.log('getting postal codes...');
  var dataArray = ((Items.find({"_id":id.toString()})).fetch())[0].data;
  var postalArray = [];
  for (var i = 0; i < dataArray.length; i++) {
    postalArray.push((dataArray[i].location).substring(0,6));
  }
  return postalArray;
}
