window.addEventListener('load', async () => {
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
        csstoken = new CSSToken(w3,window.shipAbi,window.shipAddress,web3);
        
        function joinGame(gameId) {   
            cssgame = new CSSGame(w3,window.gamesData[gameId]['abi'],window.gamesData[gameId]['address'],web3);
            cssgame.placeShip(window.shipId,function(e,tx){
                if (!e) {
                    $('body').addClass('blur');
                    $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#waiting-confirmation"});
                    setInterval(function(){
                        w3.eth.getTransactionReceipt(tx, function(e,h){
                            if (h && h.blockNumber != null) window.location.href = '/ui/' + window.gameNetwork + '/play/' + window.gamesData[gameId]['id'] + '/' + window.shipId + '/';
                        });
                    },3000);
                }
            });
        }
        
        function exitGame() {            
            csstoken.unsetGame(window.shipId,function(e,tx){
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
        
        function setQaim() {        
            csstoken.setQAIM(window.shipId,window.qaimAssign,function(e,tx){
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
            
        function assignQaimPoint(index) {
            window.qaimAssign[index]++;
            window.shipRemainingPoints--;
            $('#ship-unnasigned-points').text(window.shipRemainingPoints + '/' + window.shipUnassignedPoints + " points to assign");
            $('#ship-qaim-' + index.toString() + '-points').text(window.shipQaim[index] + '+' + window.qaimAssign[index]);
            if (window.shipRemainingPoints == 0) {
                for (i=0; i < window.shipQaim.length; i++) {
                    $('#qaim-' + i.toString()).addClass('plusOne disabled')
                }
            }
            $('#qaim-save-button').prop('disabled', false);
        }
        
        function openQaimModal() {            
            if (window.shipUnassignedPoints > 0) {
                $('#ship-unnasigned-points').text(window.shipRemainingPoints + '/' + window.shipUnassignedPoints + " points to assign");
                $('#qaim-save-button').prop('disabled', true);
                $('#qaim-save-button').show();
                $('#qaim-close-button').text("CANCEL");
                for (i=0; i < window.shipQaim.length; i++) {
                    $('#qaim-' + i.toString()).removeClass('plusOne disabled')
                    $('#qaim-' + i.toString()).addClass('plusOne')
                }
            }
            else {
                $('#ship-unnasigned-points').text("No points to assign"); 
                $('#qaim-save-button').hide();
                $('#qaim-close-button').text("CLOSE");
                
                for (i=0; i < window.shipQaim.length; i++) {
                    $('#qaim-' + i.toString()).addClass('plusOne disabled');
                    $('#qaim-' + i.toString()).disabled;
                }
            }
            for (i=0; i < window.shipQaim.length; i++) {
                $('#ship-qaim-' + i.toString() + '-points').text(window.shipQaim[i]);
            }            
            
            $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#modulo-qia"});
            $('body').addClass('blur');
        }    
        
        $('.plusOne').on('click', function() {
            if (window.shipRemainingPoints > 0)
                assignQaimPoint($(this).attr('i'))
        });
        
        $('#open-qaim-modal').on('click', function() {
            for (i=0; i < window.qaimClean.length; i++) {
                window.qaimAssign[i] = window.qaimClean[i];
            }
            window.shipRemainingPoints = window.shipUnassignedPoints;
            openQaimModal();
        });

        $('#qaim-save-button').on('click', function() {
            setQaim();
        });
        
        $('#join-game-button').on('click', function() {
            joinGame($('#select-game').val());
        });
        $('#exit-game-button').on('click', function() {
            exitGame();
        });
    });
});
