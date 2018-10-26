
var getJSON = function(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET',url, true);
	xhr.responseType = 'json';
	xhr.onload = function() {
		if (xhr.status === 200) {
			callback(null,xhr.response);
		}
		else {
			callback(xhr.response,null);
		}
	};
	xhr.send();
};


//var apiEndpointGetUser = 'http://cryptospaceship.io/api/address/';