window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
	// Use Mist/MetaMask's provider
	if (web3.currentProvider.isMetaMask === true) {
	    web3.version.getNetwork(
		function(err,network) {
		    if (!err) {
                if (typeof gameNetwork !== 'undefined' && network === gameNetwork) 
                {
                    w3 = new Web3(web3.currentProvider);
                    Contract  = w3.eth.contract(contractAbi);
                    SpaceShip = Contract.at(contractAddress);

                    document.getElementById("buy_new_ship_button").addEventListener("click", function() {
                        shipName  = document.getElementById("buy_ship_name_input").value;
                        console.log('click');
                        console.log(shipName);
                        if (shipName !== '' && shipPrice !== 'undefined') {
                            console.log(shipName);
                            SpaceShip.createShip(shipName,
                                { from: web3.eth.accounts[0],
                                  value: web3.toWei(shipPrice)}, function(err,hash) {
                                      if (!err) {
                                        setInterval(function() {
                                            web3.eth.getTransactionReceipt(hash, function(err,result){
                                                if (!err) { 
                                                    if (result != null) location.reload();
                                                }

                                            });
                                        }, 10000);
                                      }
                                }
                            );
                        }
                    });
                }
                else {
                    window.alert("Please put de correct network");
                }
		    }
		}
	    );
	}
	else {
	    window.alert("Please install MetaMask");
	}
    }
    else {
    	window.alert("Please install MetaMask");
    }
});