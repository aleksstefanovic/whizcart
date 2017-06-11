export default function unifyText (searchText) {
	searchText = searchText.toLowerCase();
  	var searchArray = searchText.split(" ");
  	for (var i=0; i < searchArray.length; i++) {
  		searchArray[i] = capitalizeFirstLetter(searchArray[i]);
  	}
  	searchText = searchArray.join(" ");
  	return searchText;
}


function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
