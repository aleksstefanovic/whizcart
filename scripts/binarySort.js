export default function binarySort (array, key, left, right) {
    //console.log("sorting...");

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
      newPivot  = partition(array, pivot, left, right, key);

      // recursively sort to the left and right
      binarySort(array, key, left, newPivot - 1);
      binarySort(array, key, newPivot + 1, right);
    }

    return array;
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

  function partition(array, pivot, left, right, key) {

    var storeIndex = left;
    if (key == 'location') {
        pivotValue = array[pivot].location;
    }
    else if (key == 'price') {
        pivotValue = parseFloat(array[pivot].price);
    }

    // put the pivot on the right
    swap(array, pivot, right);

    // go through the rest
    for(var v = left; v < right; v++) {

      // if the value is less than the pivot's
      // value put it to the left of the pivot
      // point and move the pivot point along one
      if (key == 'location') {
        if(array[v].location < pivotValue) {
          swap(array, v, storeIndex);
          storeIndex++;
        }
      }
      else if (key == 'price') {
        if(parseFloat(array[v].price) < pivotValue) {
          swap(array, v, storeIndex);
          storeIndex++;
          //console.log("SWAPPING");
        }
      }
    }

    // finally put the pivot in the correct place
    swap(array, right, storeIndex);

    return storeIndex;
  }
