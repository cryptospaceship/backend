/**
 * Requirements Vars:
 * 1- gameNetwork 
 * 2- contractAbi
 * 3- contractAddress
 * 4- shipId
 * 5- gameId
 */

var DEBUG = true;

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined' && web3.currentProvider.isMetaMask == true ) {
        web3.version.getNetwork(function(error,network) {
            if (!error && network == window.gameNetwork) {

            }
            else {
                window.alert("Please change network");
            }
        });
    }
    else {
        window.alert("Install Metamask");
    }
                if (error) {
                    window.alert(error);
                }
                else {
                    if (typeof gameNetwork === 'undefined' || network !== gameNetwork) {
                        window.alert("Please configure the correct network");
                    }
                    else {
                        w3 = new Web3(web3.currentProvider);
                        contractAccess = w3.eth.contract(contractAbi);
                        SpaceShip = contractAccess.at(contractAddress);
                        /*********************************************************************************
                         * INIT HANDLERS
                         *********************************************************************************/

                        /**
                         * Dejar el Juego
                         */
                        try {
                            document.getElementById("left-game-button").addEventListener("click", function() {
                                if (typeof shipId === 'undefined') throw "shipId undefined";

                                SpaceShip.unsetGame(shipId,{from:web3.eth.accounts[0]},function(error,txHash){
                                    if (!error) {
                                        setInterval(function() {
                                            web3.eth.getTransactionReceipt(txHash, function(err,result){
                                                if (!err) { 
                                                    if (result != null) location.reload();
                                                }
                                            });
                                        }, 10000);
                                    }
                                });
                            });    
                        }
                        catch(error) {
                            if (DEBUG) {
                                window.alert(error);
                            }
                        }
                        /**
                         * Ingresar en un juego
                         */
                        try {
                            document.getElementById("join-game-button").addEventListener("click", function() {
                                if (typeof gameId === 'undefined') throw "gameId undefined";

                                SpaceShip.getGame(gameId,function(error,gameData){
                                    if (!error) {
                                        gamePrice = gameData[5].toNumber();
                                        SpaceShip.setGame(shipId,gameId,{from:web3.eth.accounts[0],value:gamePrice},function(error,txHash){
                                            if (!error) {
                                                setInterval(function() {
                                                    web3.eth.getTransactionReceipt(txHash, function(err,result){
                                                        if (!err) { 
                                                            if (result != null) location.reload();
                                                        }
                                                    });
                                                }, 10000);
                                            }
                                        });
                                    }
                                });                
                            });
                        }
                        catch(error) {
                            if (DEBUG) {
                                window.alert(error);
                            }
                        }
                         /*********************************************************************************
                         * END HANDLERS
                         *********************************************************************************/
                    }
                }        
            });
        }
    }
});
