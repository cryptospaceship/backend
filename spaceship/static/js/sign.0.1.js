window.addEventListener('load', function() {
	  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
	if (typeof web3 !== 'undefined') {
		// Use Mist/MetaMask's provider

		try {
			document.getElementById('signup_signin_button').addEventListener('click',
				function() {
					email     = document.getElementById('email_input').value;
					ts        = document.getElementById('timestamp_input').value;
					tohash    = email + ts.toString();
					msg       = "\x19Ethereum Signed Message:\n" + tohash.length.toString() + tohash;
					web3.personal.sign(web3.sha3(msg),web3.eth.accounts[0], function(err,signature){
						if (!err) {
							document.getElementById('signature_input').value = signature;
							// Transformar boton
						}
					});		
				}
			);
		}
		catch(err) {
			
		} 	
	}
	// Instalar MetaMask
});
