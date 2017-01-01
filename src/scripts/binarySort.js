export default function binarySort (array, left, right) {
//    console.log("sorting...");

    var pivot = null;

    if(typeof left !== 'number') {
      left = 0;
    }

    if(typeof right !== 'number') {
      right = array.length - 1;
    }

    // effectively set our base
    // case here. When left == right
    // we'll stop
    if(left < right) {

      // pick a pivot between left and right
      // and update it once we've partitioned
      // the array to values < than or > than
      // the pivot value
      pivot     = left + Math.ceil((right - left) * 0.5);
      newPivot  = partition(array, pivot, left, right);

      // recursively sort to the left and right
      binarySort(array, left, newPivot - 1);
      binarySort(array, newPivot + 1, right);
    }
} 

  function swap(array, indexA, indexB) {
    var temp = array[indexA];
    array[indexA] = array[indexB];
    array[indexB] = temp;
  }
  
  function getFirst (object) {
    for (var i in object) {
      return i;
    }
  }

  function partition(array, pivot, left, right) {

    var storeIndex = left,
        pivotValue = array[pivot].location;

    // put the pivot on the right
    swap(array, pivot, right);

    // go through the rest
    for(var v = left; v < right; v++) {

      // if the value is less than the pivot's
      // value put it to the left of the pivot
      // point and move the pivot point along one
      if(array[v].location < pivotValue) {
        swap(array, v, storeIndex);
        storeIndex++;
      }
    }

    // finally put the pivot in the correct place
    swap(array, right, storeIndex);

    return storeIndex;
  }
