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

var setAddress = function(address) {
    document.getElementById('sign_address_input').value = address;
};

var signWithMetamask = function(str, form_id, network, redirect) {
    web3.personal.sign(web3.fromUtf8(str),web3.eth.accounts[0], 
	function(err,sign) {
	    if (!err) {
                document.getElementById('sign_network_input').value = network;
		document.getElementById('sign_signature_input').value = sign;
		f = document.getElementById(form_id);
		console.log(f);
        f.action = redirect;
		f.submit();
	    }	
	    console.log(err);
	}
    );
}


window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
	// Use Mist/MetaMask's provider
	if (web3.currentProvider.isMetaMask === true) {
	    web3.version.getNetwork(
		function(err,network) {
		    if (!err) {
				if (web3.eth.accounts[0] == undefined) {
					window.location.href = '/metamask/';
				}
			    getJSON(
				api_userByAddress + web3.eth.accounts[0],
				function(err,ret) {
				    if (!err) {
					if (ret['user']) {
					    if (signup) {
						window.location.href = signinLocation;
					    }
					    // Estoy en signin
					    setAddress(web3.eth.accounts[0]);
					    document.getElementById('sign_with_metamask').addEventListener('click',function() {
						str = document.getElementById('sign_address_input').value;
						signWithMetamask(str,'signin_form', network, '/signin/');
					    });
					    
					}
					else {
					    if (!signup) {
						window.location.href = signupLocation;
					    }
					    // Estoy en signup
					    setAddress(web3.eth.accounts[0]);
					    document.getElementById('sign_with_metamask').addEventListener('click',function() {
						str = document.getElementById('signup_email_input').value;
						str = str + ':' +  document.getElementById('signup_username_input').value;
						signWithMetamask(str,'signup_form', network, '/signup/');
					    });
					}
				    }
				}
			    );
		    }
		}
	    );
	}
	else {
		window.location.href = '/metamask/';
	}
    }
    else {
		window.location.href = '/metamask/';
    }
});