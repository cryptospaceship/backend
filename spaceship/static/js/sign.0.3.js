
window.addEventListener('load', async () => {
	config = {};
	config.install = "/metamask/";
	config.unlock = "/unlock/";
	config.account = undefined;
	config.network = "/network/";
	config.networks = [42,77];
    
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
            // Acccounts now exposed
        } catch (error) {
            // User denied account access...
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
        // Acccounts always exposed
    }
    // Non-dapp browsers...
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
    
	init = new CSSInit(config,window.web3);
	init.init(function(){
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
						f.action = redirect;
						f.submit();
					}	
				}
			);
		}

		CSSInit.getJSON(window.api_userByAddress + web3.eth.accounts[0],function(err,ret) {
			if (!err) {
				if (ret['user']) {
					if (signup) {
						window.location.href = window.signinLocation;
					}
					setAddress(web3.eth.accounts[0]);
					document.getElementById('sign_with_metamask').addEventListener('click',function() {
						str = document.getElementById('sign_address_input').value;
						signWithMetamask(str,'signin_form', 42, '/signin/');
					});
				}
				else {
					if (!signup) {
						window.location.href = window.signupLocation;
					}
					// Estoy en signup
					setAddress(web3.eth.accounts[0]);
					document.getElementById('sign_with_metamask').addEventListener('click',function() {
						str = document.getElementById('signup_email_input').value;
						str = str + ':' +  document.getElementById('signup_username_input').value;
						signWithMetamask(str,'signup_form', 42, '/signup/');
					});
				}
			}
		});
	});
});