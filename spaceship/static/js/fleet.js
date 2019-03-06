window.addEventListener('load', async() => {
	config = {};
	config.install = "/metamask/";
	config.unlock = "/unlock/";
	config.account = window.player_address;
	config.network = "/network/";
	config.networks = [42,77,31];
    config.signout  = "/signout/"
    
    init = new CSSInit(config,window.web3);
    
	init.init(function(){
        window.shipNameTx = undefined;
        window.csstoken = new CSSToken(this.web3,window.gameAbi,window.gameAddress);

        document.getElementById("buy_new_ship_button").addEventListener("click", function() {
            window.shipName  = document.getElementById("buy_ship_name_input").value;
            if (window.shipName != "" && window.shipName != window.shipNameTx) {
                window.shipNameTx = window.shipName;
                let color = document.getElementById("choosed_color").value;
                window.csstoken.createShip(shipName,CSSToken.colorToNumber(color),function(e,tx){ 
                    if (!e) {
                        $('body').addClass('blur');
                        $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#waiting-confirmation"});
                        setInterval(function(){
                            window.csstoken.w3.eth.getTransactionReceipt(tx, function(e,h){
                                if (h && h.blockNumber != null) window.location.reload();
                            });
                        },3000);
                    }
                    else 
                        window.shipNameTx = undefined;
                });
            }
        });
    });
});
