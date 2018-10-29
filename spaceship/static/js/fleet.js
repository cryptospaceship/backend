window.addEventListener('load', async() => {
	config = {};
	config.install = "/metamask/";
	config.unlock = "/unlock/";
	config.account = window.player_address;
	config.network = "/network/";
	config.networks = [42,77];
    config.signout  = "/signout/"

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
        w3 = window.web3;
        window.csstoken = new CSSToken(w3,window.gameAbi,window.gameAddress,web3);

        document.getElementById("buy_new_ship_button").addEventListener("click", function() {
            shipName  = document.getElementById("buy_ship_name_input").value;
            if (shipName != "") {
                let color = document.getElementById("choosed_color").value;
                window.csstoken.createShip(shipName,CSSToken.colorToNumber(color),function(e,tx){ 
                    if (!e) {
                        $('body').addClass('blur');
                        $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#waiting-confirmation"});
                        setInterval(function(){
                            w3.eth.getTransactionReceipt(tx, function(e,h){
                                if (h && h.blockNumber != null) window.location.reload();
                            });
                        },3000);
                    }
                });
            }
        });
    });
});
