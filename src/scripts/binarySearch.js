
export default function binarySearch(haystack, needle) {
	  console.log("performing binary search");
	if(needle == "") return [];
	var haystackLength 	= haystack.length;
	var letterNumber 	= needle.length;
		
	/* start binary search, Get middle position */
	var getElementPosition = findElement()
	
	/* get interval and return result array */
	if(getElementPosition == -1) return [];
	return getElementPosition;
	//ORIGINAL CODE 
	//return getRangeElement = findRangeElement()
	
	function findElement() {
		if (typeof(haystack) === 'undefined' || !haystackLength) return -1;
		
		var high = haystack.length - 1;
		var low = 0;
		
		while (low <= high) {
			mid = parseInt((low + high) / 2);
			var element = haystack[mid].location;
			console.log("BS Element:"+element);
			
			if (element > needle) {
				high = mid - 1;
			} else if (element < needle) {
				low = mid + 1;
			} else {
				
				return mid;
			}
		}
		return -1;
	}
	function findRangeElement(){
		
		for(i=getElementPosition; i>0; i--){
			var element =  haystack[i].location;
			if(element != needle){
				var start = i+1;
				break;
			}else{
				var start = 0;
			}
		}
		for(i=getElementPosition; i<haystackLength; i++ ){
			var element =  haystack[i].location;
			if(element != needle){
				var end = i;
				break;
			}else{
				var end = haystackLength -1;
			}
		}
		var result = [];
		for(i=start; i<end;i++){
			result.push(haystack[i])
		}

		return result;
	}
	
}
