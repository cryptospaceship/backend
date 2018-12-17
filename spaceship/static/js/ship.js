window.addEventListener('load', async () => {
	config = {};
	config.install = "/metamask/";
	config.unlock = "/unlock/";
	config.account = window.player_address;
	config.network = "/network/";
	config.networks = [42,77];
    config.signout  = "/signout/"

    
    init = new CSSInit(config);
    
	init.init(function(){
        $('#ship_points').text(CSSToken.formatPoints(window.points));
        let w3 = this.web3;
        window.csstoken = new CSSToken(this.web3,window.shipAbi,window.shipAddress);
        
        window.qaim_1 = undefined;
        window.qaim_2 = undefined;

        function joinGame(gameId) {   
            window.cssgame = new CSSGame(w3,window.gamesData[gameId]['abi'],window.gamesData[gameId]['address'],42);
            console.log('flens');
            window.cssgame.placeShip(window.shipId,window.qaim_1,window.qaim_2,function(e,tx){
                if (!e) {
                    $('body').addClass('blur');
                    $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#waiting-confirmation"});
                    setInterval(function(){
                        w3.eth.getTransactionReceipt(tx, function(e,h){
                            if (h && h.blockNumber != null && h.status != "0x0") window.location.href = '/ui/' + window.gameNetwork + '/play/' + window.gamesData[gameId]['id'] + '/' + window.shipId + '/';
                        });
                    },3000);
                }
                else {
                    $('#join-game-button').attr("disabled", false);
                    $('#join-game-button').css({'background-color':'#E50E32'});
                }
                concole.log(e);
            });
        }
        
        function exitGame() {            
            window.csstoken.exitGame(window.shipId,function(e,tx){
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
            window.csstoken.setQAIM(window.shipId,window.qaimAssign,function(e,tx){
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
           
        function form_completed() {
            if ((typeof window.qaim_1 !== 'undefined') && (typeof window.qaim_2 !== 'undefined') && ($('#select-game').val() != 'Select an option'))
                return true
            else
                return false;
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
        /*    
        $('#select-game-modal').on('click', function(){
            window.qaim_1 = undefined;
            window.qaim_2 = undefined;
            for (i = 0; i <= 6-1; i++) {
                q = '#qaims' + i.toString();
                $(q).prop('checked', false);
                $(q).on('click', function(){
                    checked = $(this).attr('qaim');
                    if (window.qaim_1 == checked) {
                        window.qaim_1 = undefined;
                    } else {
                        if (window.qaim_2 == checked) {
                            window.qaim_2 = undefined;
                        } else {
                            if (typeof window.qaim_1 !== 'undefined') {
                                q = '#qaims' + window.qaim_1;
                                $(q).prop('checked', false);
                            }
                            window.qaim_1 = window.qaim_2;
                            window.qaim_2 = checked;
                        }
                    }
                });
            }
            $('body').addClass('blur');
            $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#join-game"});
        });
        */
        
        $('#select-game-modal').on('click', function(){
            window.qaim_1 = undefined;
            window.qaim_2 = undefined;
            $('#select-game').val('Select an option');
            $('#join-game-button').attr("disabled", true);
            $('#join-game-button').css({'background-color':'#A80621'});
            for (i = 0; i <= 6-1; i++) {
                q = '#qaims' + i.toString();
                $(q).prop('checked', false);
                $(q).on('click', function(){
                    checked = $(this).attr('qaim');
                    if (window.qaim_1 == checked) {
                        window.qaim_1 = window.qaim_2;
                        window.qaim_2 = undefined;
                    } else if (window.qaim_2 == checked) {
                        window.qaim_2 = undefined;
                    } else {
                        if (typeof window.qaim_1 === 'undefined') {
                            window.qaim_1 = checked;
                        } else if (typeof window.qaim_2 === 'undefined') {
                            window.qaim_2 = checked;
                        } else {
                            q = '#qaims' + window.qaim_1;
                            $(q).prop('checked', false);
                            window.qaim_1 = window.qaim_2;
                            window.qaim_2 = checked;
                        }
                    }
                    if (form_completed()) {
                        $('#join-game-button').attr("disabled", false);
                        $('#join-game-button').css({'background-color':'#E50E32'});
                    } else {
                        $('#join-game-button').attr("disabled", true);
                        $('#join-game-button').css({'background-color':'#A80621'});
                    }
                });
                
            }
            $('#select-game').change(function() {
                if (form_completed()){
                    $('#join-game-button').attr("disabled", false);
                    $('#join-game-button').css({'background-color':'#E50E32'});
                } else {
                    $('#join-game-button').attr("disabled", true);
                    $('#join-game-button').css({'background-color':'#A80621'});
                }
            });
            $('body').addClass('blur');
            $.colorbox({inline:true, closeButton: false, arrowKey: false, overlayClose: false,href:"#join-game"});
        });
        
        
        
        
        
        $('#qaim-save-button').on('click', function() {
            setQaim();
        });
        
        $('#join-game-button').on('click', function() {
            $('#join-game-button').attr("disabled", true);
            $('#join-game-button').css({'background-color':'#A80621'});
            joinGame($('#select-game').val());
        });

        $('#exit-game-button').on('click', function() {
            exitGame();
        });
    });
});
