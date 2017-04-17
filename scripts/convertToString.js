export default function convertToString (str) {
	if (str == 'NaN') {
		return "";
	}
	else if (str) {
		return str;
	}
	else {
		return "";
	}
}