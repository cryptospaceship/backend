window.addEventListener('load', async () => {
	config = {};
	config.install = "/metamask/";
	config.unlock = "/unlock/";
	config.account = window.player_address;
	config.network = "/network/";
	config.networks = [window.gameNetwork];
    config.signout  = "/signout/"
    init = new CSSInit(config,window.web3);

    init.init(function() {
        window.cssgame = new CSSGame(this.web3,window.gameAbi,window.gameAddress,window.gameNetwork);
        window.backend = new Backend(window.base_url);

        function setGameStats() {
            let noOwner = "0x0000000000000000000000000000000000000000";
            if (window.planetOwner != noOwner) {
                if (window.blocksToEnd < 0)
                    window.blocksToEnd = 0;
                $('#blocks-to-end').text(window.blocksToEnd);
                if (window.cssgame.w3.eth.accounts[0] != window.planetOwner)
                    $('#win-condition').text("LOSING");
                else
                    $('#win-condition').text("WINNING");
                $('#conquest-message').show();
            }
            $('#reward').text(window.reward/1000000000000000000);
            $('#game-age').text(window.gameAge);
            $('#players').text(window.players);
        }

        setInterval(()=>{
            window.cssgame.getGame((e,r)=>{
                if (!e) {
                    window.cssgame.w3.eth.getBlockNumber((e,b)=>{
                        if (!e) {
                            ret = window.cssgame.getGameResult(r);
                            window.gameAge = b - ret.gameLaunch;
                            if (b > ret.endBlock) 
                                window.blocksToEnd = 0;
                            else
                                window.blocksToEnd = ret.endBlock - b;
                            window.planetOwner = ret.candidate;
                            window.reward = ret.reward;
                            window.players = ret.players;
                            setGameStats();
                        }
                    });
                } else {
                    console.log(e);
                }
            });
        },5000);

        function process_order (tx) {
            /*
             * Se cierra el modal
             */
            $(window.id_modal_open).modal('hide');
            setInterval(()=>{
                this.web3.eth.getTransactionReceipt(tx, function(e,h){
                    if (h && h.blockNumber != null) location.reload();
                });
            },3000);
            //$('#link-to-explorer').attr('href', window.explorer_url + tx);
            $('#link-to-explorer').attr('onclick', "window.parent.open('" + window.explorer_url + tx +  "', '_blank'); return false;");
            $('#modal-tx').modal('show');
        }
        
        function clean_modal() {
            window.id_modal_open = undefined;
        }


        function setDamage() {
            let status = 100 - window.damage;
            let statusPercentage = status.toString() + '%'
            $('#bar-ship-status').css('width', statusPercentage);
            if (status <= 25) {
                $('#bar-ship-status').css('background-color', '#eb1e0fbd');
                $('#ship-status-value').css('animation','blinker 1s linear infinite');
            } else {
                if (status < 80) {
                    $('#bar-ship-status').css('background-color', '#d9eb0fbd');
                }
            }
            $('#ship-status-value').text(status);

            if (window.damage != 0 && window.in_port) {
                $('#repair-button').show();
            } 
        }


        function showMapArrows(x,y) {
            if (x < 0 || x > (window.map_size - 1) || y < 0 || y > (window.map_size - 1))
                throw "Invalid Axis";

            $('#button-arrow-right').hide();
            $('#button-arrow-left').hide();
            $('#button-arrow-up').hide();
            $('#button-arrow-down').hide();
            $('#button-arrow-right-end').hide();
            $('#button-arrow-left-end').hide();
            $('#button-arrow-up-end').hide();
            $('#button-arrow-down-end').hide();

            if ( x > 0 ) {
                $('#button-arrow-left').show();
            }
            else {
                $('#button-arrow-left-end').show();
            }
            if ( x + 7 <= (window.map_size - 1)) {
                $('#button-arrow-right').show();
            }
            else {
                $('#button-arrow-right-end').show();
            }
            if ( y > 0 ) {
                $('#button-arrow-up').show();
            }
            else {
                $('#button-arrow-up-end').show();
            }
            if ( y + 7 <= (window.map_size - 1)) {
                $('#button-arrow-down').show();
            }
            else {
                $('#button-arrow-down-end').show();
            }
        }

    /*--------------------------------------------*
        * Handler para el mapa                       *
        *--------------------------------------------*/
    
        for ( i = 0; i <= 49-1; i++ ) {
            position = '#map_position_' + i.toString();
            $(position).click(function() {
                id = $(this).attr('id');
                mapHandler('#'+id);
            });
        }
    

        // Handler for button GO
        $('#button-go').click(function() {
            coord_x = parseInt($('#go-to-x').val());
            coord_y = parseInt($('#go-to-y').val());
            if (coord_x >= 0 && coord_x <=(window.map_size - 1) && coord_y >= 0 && coord_y <= (window.map_size - 1)) {
                if (coord_x < 3) coord_x = 3;
                if (coord_x > (window.map_size - 4)) coord_x = (window.map_size - 4);
                if (coord_y < 3) coord_y = 3;
                if (coord_y > (window.map_size - 4)) coord_y = (window.map_size - 4);
                window.map_center_x = coord_x;
                window.map_center_y = coord_y;
                refreshMap();
            }
            else {
                $('#go-to-x').val("");
                $('#go-to-y').val("");
            }
        });

        // Handler for arrow up
        $('#button-arrow-up').click(function() {
            window.map_center_y--;
            refreshMap();
        });

        // Handler for arrow down
        $('#button-arrow-down').click(function() {
            window.map_center_y++;
            refreshMap();
        });

        // Handler for arrow left
        $('#button-arrow-left').click(function() {
            window.map_center_x--;
            refreshMap();
        });

        // Handler for arrow right
        $('#button-arrow-right').click(function() {
            window.map_center_x++;
            refreshMap();
        });


        function refreshMap() {
            window.cssgame.getStrategicMap(window.map_center_x,window.map_center_y,function(e,r) {
                if (!e) {
                    ret = window.cssgame.getStrategicMapResult(r);
                    if (ret.center_x == window.map_center_x && ret.center_y == window.map_center_y) {
                        if (!mapArrayCmp(ret.map)) {
                            window.map = ret.map;
                            setMap();
                        }
                    }
                }
            });
        }


        /*
         * Handler para apertura de modal
         */ 
        $('#button-attack-mode').click(function() {
            $('#attack-mode-shipname').text("Set " + window.shipName.toString() + " to Attack Mode.");
            if (window.mode != window.ATTACK_MODE && canChangeMode()) {
                $('#confirm-change-attack-mode').click(function() {
                    cssgame.changeMode(window.ship, window.ATTACK_MODE,function(e,h){
                        if (!e) {
                            process_order (h);
                        }    
                    });
                });
            }
            else {
                $('#confirm-change-attack-mode').addClass('disabled');
            }
            window.id_modal_open = '#modalAttackMode';
            $(window.id_modal_open).modal('show');
        });

        $('#button-defense-mode').click(function() {
            $('#defense-mode-shipname').text("Set " + window.shipName.toString() + " to Defense Mode.");
            if (window.mode != window.DEFENSE_MODE && canChangeMode()) {
                $('#confirm-change-defense-mode').click(function() {
                    cssgame.changeMode(window.ship, window.DEFENSE_MODE,function(e,h){
                        if (!e) {
                            process_order (h);
                        }    
                    });
                });
            }
            else {
                $('#confirm-change-defense-mode').addClass('disabled')
            }
            window.id_modal_open = '#modalDefenseMode';
            $(window.id_modal_open).modal('show');
        });

        $('#button-movemment-mode').click(function() {
            $('#movemment-mode-shipname').text("Set " + window.shipName.toString() + " to Movemment Mode.");
            if (window.mode != window.MOVEMMENT_MODE && canChangeMode()) {
                $('#confirm-change-movemment-mode').click(function() {
                    cssgame.changeMode(window.ship, window.MOVEMMENT_MODE,function(e,h){
                        if (!e) {
                            process_order (h);
                        }    
                    });
                });
            }
            else {
                $('#confirm-change-movemment-mode').addClass('disabled')
            }
            window.id_modal_open = '#modalMovemmentMode';
            $(window.id_modal_open).modal('show');
        });

        $('#button-default-mode').click(function() {
            $('#default-mode-shipname').text("Set " + window.shipName.toString() + " to Default Mode.");
            if (window.mode != window.DEFAULT_MODE && canChangeMode()) {
                $('#confirm-change-default-mode').click(function() {
                    cssgame.changeMode(window.ship, window.DEFAULT_MODE,function(e,h){
                        if (!e) {
                            process_order (h);
                        }    
                    });
                });
            }    
            else {
                $('#confirm-change-default-mode').addClass('disabled')
            }
            window.id_modal_open = '#modalDefaultMode';
            $(window.id_modal_open).modal('show');
        });


        $('#modalAttackMode').on('hidden.bs.modal',function() { 
            clean_modal();
            $('#confirm-change-attack-mode').off();
            $('#confirm-change-attack-mode').removeClass('disabled');                        
        });
        
        $('#modalDefenseMode').on('hidden.bs.modal',function() {
            clean_modal();
            $('#confirm-change-defense-mode').off();
            $('#confirm-change-defense-mode').removeClass('disabled')
        });
        
        $('#modalMovemmentMode').on('hidden.bs.modal',function() { 
            clean_modal();
            $('#confirm-change-movemment-mode').off();
            $('#confirm-change-movemment-mode').removeClass('disabled');
        });
        
        $('#modalDefaultMode').on('hidden.bs.modal',function() { 
            clean_modal();
            $('#confirm-change-default-mode').off();
            $('#confirm-change-default-mode').removeClass('disabled');
        });

        function cannonInModal(target) {
            let p;
            let damage;
            if (target == 0)
                p = parseInt((window.energyStock * 100 / 2000000));
            else
                p = parseInt((window.energyStock * 100 / 3000000));

            if (p > 100) {
                p = 100;
            }
            let pstr = p.toString() + '%';

            if (target == 0)
                damage = CSSGame.getCannonDamage([window.position_x,window.position_y],[x,y], window.cannon_level, false);
            else
                damage = CSSGame.getCannonDamage([window.position_x,window.position_y],[x,y], window.cannon_level, true);

            $('#data-cannon-to-fire').text(pstr);
            $('#bar-cannon-to-fire').css('width',pstr);


            if (CSSGame.checkCannonRange([window.position_x,window.position_y],[x,y], window.cannon_level)) {
                if (!window.in_port) {
                    if (window.blocks_to_fire == 0) {
                        if (CSSGame.energyToFire(window.energyStock)) {
                            if (window.mode == 2) {
                                $('#cannon-status').text('Ready');
                                $('#cannon-damage-percentage').text(damage + '%');
                                return true;
                            }
                            else {
                                $('#cannon-status').text('Wrong mode');
                                $('#cannon-damage-percentage').text('-');
                                return false;
                            }
                        }
                        else {
                            $('#cannon-status').text('Loading');
                            $('#cannon-damage-percentage').text('-');
                            return false;
                        }
                    }
                    else {
                        $('#cannon-status').text('Waiting');
                        $('#cannon-damage-percentage').text('-');
                        return false;
                    }
                }
                else {
                    $('#cannon-status').text('Ship in Port');
                    $('#cannon-damage-percentage').text('-');
                    return false;
                }
            }
            else {
                $('#cannon-status').text('Out of range');
                $('#cannon-damage-percentage').text('-');
                return false;
            }
        }




        function mapHandler(id) {
            type = $(id).attr("map-type");
            x = parseInt($(id).attr("map-coord-x"));
            y = parseInt($(id).attr("map-coord-y"));
            objectId = parseInt($(id).attr("map-object-id"));
            cssgame.getInPosition(x,y,function(e,r) {
                if (!e) {
                    ret = cssgame.getInPositionResult(r);
                    if (ret.id == 0) { // Empty
                        $('#distance-to').text(CSSGame.getDistance([window.position_x,window.position_y],[x,y]));
                        $('#location_x-space').text(x);
                        $('#location_y-space').text(y);
                        $('#graphene-density').text(ret.graphene);
                        $('#metals-density').text(ret.metals);
                        $('#move-ship-distance').text(CSSGame.getRangeByMode(window.mode))
                        
                        if (CSSGame.isShipInRange([window.position_x,window.position_y],[x,y], window.mode)) {
                            if (window.blocks_to_move == 0) {
                                $('#move-ship-status').text('Ready');
                                /*
                                * Se define el handler para moverse
                                * a esa ubicacion
                                */
                                $('#move-to-location').click(function() {
                                    cssgame.moveTo(window.ship,x,y,function(e,h){
                                        if (!e) {
                                            process_order(h);
                                        }
                                    });
                                });
                            }
                            else {
                                $('#move-ship-status').text('Waiting');
                                $('#move-to-location').addClass('disabled');
                            }
                        }
                        else {
                            $('#move-ship-status').text('Out of range');
                            $('#move-to-location').addClass('disabled');
                        }
                        /*
                         * Se muestra el modal
                         */ 
                        window.id_modal_open = '#modalMapEmpty';
                        $('#modalMapEmpty').modal('show');
                    }
                    else {
                        if (CSSGame.isShip(ret.id) && ret.id != window.ship) {
                            $('#distance-to-ship').text(CSSGame.getDistance([window.position_x,window.position_y],[x,y]));
                            window.other_ship = ret.id;
                            $('#location_x-ship').text(x);
                            $('#location_y-ship').text(y);

                            cssgame.viewShip(window.other_ship,function(e,r){
                                if (!e) {
                                    ret = cssgame.viewShipResult(r);
                                    $('#other-ship-name').text(ret.name);
                                    $('#other-ship-name-message').attr('href', '../messages/inbox/?to=' + ret.name);
                                    $('#other-ship-id').text(window.other_ship);
                                    $('#other-ship-mode').text(CSSGame.getModeName(ret.mode));
                                }
                            });

                            /*
                             * Si tiene cañon lo muestra
                             */ 
                            $('#fire-cannon-button').addClass('disabled');
                            if (window.cannon == false) {
                                $('[id=pad-no-wopr]').show();
                                $('[id=wopr-modal-ship]').hide();   
                                $('[id=send-resources-modal-ship]').removeClass('col-md-4');
                                $('[id=attack-modal-ship]').removeClass('col-md-4');
                                $('[id=send-resources-modal-ship]').addClass('col-md-5');
                                $('[id=attack-modal-ship]').addClass('col-md-5');
                            }
                            else {
                                /*
                                 * Dibuja los atributos del cañon
                                 */
                                $('#cannon-target').on('change',()=>{
                                    let t = $('#cannon-target').val();
                                    window.target = CSSGame.valueToTarget(t);
                                    $('#fire-cannon-button').off();
                                    if (cannonInModal(window.target)) {                                                
                                        $('#fire-cannon-button').removeClass('disabled');
                                        $('#fire-cannon-button').click(function() {
                                            cssgame.fireCannon(window.ship,window.other_ship, window.target,function(e,h) {
                                                if (!e) {
                                                    process_order(h);
                                                }
                                            });
                                        });
                                    }
                                });

                                if (cannonInModal(window.target)) {                                                
                                    $('#fire-cannon-button').removeClass('disabled');
                                    $('#fire-cannon-button').click(function() {
                                        cssgame.fireCannon(window.ship,window.other_ship, window.target,function(e,h) {
                                            if (!e) {
                                                process_order(h);
                                            }
                                        });
                                    });
                                }
                            }
                            
                            if (window.fleet_type > 0) {
                                $('#own-fleet-type').text(CSSGame.getFleetTypeName(window.fleet_type));
                                $('#own-fleet-size').text(window.fleet_size);
                                $('#own-fleet-distance').text(CSSGame.getFleetRange(window.fleet_distance, window.mode) + " gdu");
                                $('#own-fleet-load').text(parseInt(window.fleet_size * window.fleet_load/1000) + " kU");
                            }
                            else {
                                $('#own-fleet-type').text("Undesigned Fleet");
                                $('#own-fleet-size').text("-");
                                $('#own-fleet-distance').text("-");
                                $('#own-fleet-load').text("-")
                            }
                            
                            
                            if (window.fleet_size > 0) {
                                if (CSSGame.isFleetinRange([window.position_x,window.position_y],[x,y], window.fleet_distance, window.mode)) {
                                    if (window.blocks_to_fleet == 0) {
                                        if (!window.in_port) {
                                            $('#own-fleet-status').text("Ready");
                                            /*
                                            * Define el handler para mandar los recursos
                                            */ 
                                            $('#send-resources-button').click(function() {
                                                let energy = $('#energy-to-send').val();
                                                let graphene = $('#graphene-to-send').val();
                                                let metals = $('#metals-to-send').val();
                                                cssgame.sendResources(window.ship,window.other_ship,energy,graphene,metals,function(e,h){
                                                    if (!e) {
                                                        process_order(h);                  
                                                    }
                                                });
                                            });
                                            /*
                                             * Define el handler para atacar
                                             */ 
                                            $('#attack-button').click(function() {
                                                cssgame.attackShip(window.ship,window.other_ship, function(e,h){
                                                    if (!e) {
                                                        process_order(h);
                                                    }
                                                });
                                            });

                                            
                                            $('#raid-button').click(function() {
                                                cssgame.raidShip(window.ship,window.other_ship, function(e,h){
                                                    if (!e) {
                                                        process_order(h);
                                                    }
                                                });
                                            });
                                        }
                                        else {
                                            $('#own-fleet-status').text("Ship in port");
                                            $('#attack-button').addClass('disabled');
                                            $('#raid-button').addClass('disabled');
                                            $('#send-resources-button').addClass('disabled');
                                            $('#energy-to-send').attr('readonly', '');
                                            $('#graphene-to-send').attr('readonly', '');
                                            $('#metals-to-send').attr('readonly', '');
                                        }
                                    }
                                    else {
                                        $('#own-fleet-status').text("Waiting");
                                        $('#attack-button').addClass('disabled');
                                        $('#raid-button').addClass('disabled');
                                        $('#send-resources-button').addClass('disabled');
                                        $('#energy-to-send').attr('readonly', '');
                                        $('#graphene-to-send').attr('readonly', '');
                                        $('#metals-to-send').attr('readonly', '');
                                    }
                                }
                                else {
                                    $('#own-fleet-status').text("Out of range");
                                    $('#attack-button').addClass('disabled');
                                    $('#raid-button').addClass('disabled');
                                    $('#send-resources-button').addClass('disabled');
                                    $('#energy-to-send').attr('readonly', '');
                                    $('#graphene-to-send').attr('readonly', '');
                                    $('#metals-to-send').attr('readonly', ''); 
                                }                                        
                            }
                            else {
                                $('#own-fleet-status').text("-");
                                $('#attack-button').addClass('disabled');
                                $('#raid-button').addClass('disabled');
                                $('#send-resources-button').addClass('disabled');
                                $('#energy-to-send').attr('readonly', '');
                                $('#graphene-to-send').attr('readonly', '');
                                $('#metals-to-send').attr('readonly', '');
                            }
                            window.id_modal_open = '#modal-map-other-ship';
                            $('#modal-map-other-ship').modal("show");
                        }
                        else if (ret.id != window.ship){
                            let distance = CSSGame.getDistance([window.position_x,window.position_y],[x,y]);
                            $('#planet-location').text('[' + x.toString() + ',' + y.toString() + ']');
                            $('#planet-distance').text(distance);
                            $('#planet-ship-range').text(CSSGame.getRangeByMode(window.mode))
                            
                            cssgame.getPort(function(e,r){
                                if (!e) {
                                    ret = cssgame.getPortResult(r);
                                    $('#planet-name').text(ret.name);
                                    cssgame.getShipByOwner(ret.owner, function(e,r) {
                                        if (!e) {
                                            ship_id = cssgame.getShipByOwnerResult(r);
                                            if (ship_id != -1)
                                                $('#planet-owner').text(ship_id);
                                        }
                                    });
                                    let defenders = '';
                                    window.is_defender = false;
                                    for (i=0; i<4; i++) {
                                         defenders = defenders + ' ' + ret.defenders[i].toString();
                                         if (window.ship == ret.defenders[i]) {
                                            window.is_defender = true;
                                         }
                                    }
                                    $('#planet-defenders').text(defenders);
                                }

                            });
                            
                            if (window.fleet_type !=0) {
                                $('#planet-fleet-type').text(CSSGame.getFleetTypeName(window.fleet_type));
                                $('#planet-fleet-size').text(window.fleet_size);
                                $('#planet-fleet-distance').text(CSSGame.getFleetRange(window.fleet_distance, window.mode) + " gdu");
                            }
                            else {
                                $('#planet-fleet-type').text("Undesigned Fleet");
                                $('#planet-fleet-size').text("-");
                                $('#planet-fleet-distance').text("-");
                            }                                  
                                                                                                           
                            if (window.fleet_size > 0) {
                                let inRange = CSSGame.isFleetinRange([window.position_x,window.position_y],[x,y], window.fleet_distance, window.mode)
                                if (inRange) {
                                    if (window.blocks_to_fleet == 0){
                                        if (!window.in_port) {
                                            $('#planet-fleet-status').text("Ready");
                                            $("#button-attack-planet").click(function() {
                                                cssgame.attackPort(window.ship,objectId,function(e,h){
                                                    if (!e) {
                                                        process_order(h);
                                                    }
                                                });
                                            });
                                        }
                                        else {
                                            $('#planet-fleet-status').text("Ship in port");
                                            $("#button-attack-planet").addClass('disabled');
                                        }
                                    }
                                    else {
                                        $('#planet-fleet-status').text("Waiting");
                                        $("#button-attack-planet").addClass('disabled');
                                    }
                                }
                                else {
                                    $('#planet-fleet-status').text("Out of range");
                                    $("#button-attack-planet").addClass('disabled');
                                }
                                
                                if (CSSGame.isShipInRange([window.position_x,window.position_y],[x,y], window.mode)) {
                                    if (window.blocks_to_move == 0) {
                                        if (!window.in_port) {
                                            $("#planet-ship-status").text("Ready");
                                            $("#button-defend-to").click(function() {
                                                cssgame.landTo(window.ship,x,y,true,function(e,h){
                                                    if (!e) {
                                                        process_order(h);
                                                    }
                                                });
                                            });
                                        }
                                        else {
                                            $("#button-defend-to").addClass('disabled');
                                            $("#planet-ship-status").text("Ship in port");
                                        }
                                    }
                                    else {
                                        $("#button-defend-to").addClass('disabled');
                                        $("#planet-ship-status").text("Waiting");
                                    }
                                }
                                else {
                                    $("#button-defend-to").addClass('disabled');
                                    $("#planet-ship-status").text("Out of range");
                                }
                            }
                            else {                                                                         
                                $('#planet-fleet-status').text("-");
                                $("#button-attack-planet").addClass('disabled');
                                $("#button-defend-to").addClass('disabled');
                            }
                            
                            if (CSSGame.isShipInRange([window.position_x,window.position_y],[x,y], window.mode)) {
                                if (window.blocks_to_move == 0) {
                                    if (!window.in_port || window.is_defender) {
                                        $("#planet-ship-status").text("Ready");
                                        $("#button-land-to").click(function() {
                                            cssgame.landTo(window.ship,x,y,false,function(e,h){
                                                if (!e) {
                                                    process_order(h);
                                                }
                                            });
                                        });
                                    }
                                    else {
                                        $("#button-land-to").addClass('disabled');
                                        $("#planet-ship-status").text("Ship in port");
                                    }
                                }
                                else {
                                    $("#button-land-to").addClass('disabled');
                                    $("#planet-ship-status").text("Waiting");
                                }
                            }
                            else {
                                $("#button-land-to").addClass('disabled');
                                $("#planet-ship-status").text("Out of range");
                            }              
                            window.id_modal_open = '#modalMapPlanet';
                            $('#modalMapPlanet').modal("show");
                        }
                    }
                }
            });
        }
        
        /*
         * Limpia el handler para el boton de move-to-location
         */
        $('#modalMapEmpty').on('hidden.bs.modal',function() {
            clean_modal();
            $('#move-to-location').off();
            $('#move-to-location').removeClass('disabled');
        });

         $('#modalMapPlanet').on('hidden.bs.modal',function() {
            clean_modal();
            window.is_defender = undefined;
            $("#button-land-to").off();
            $("#button-defend-to").off();
            $("#button-attack-planet").off();
            $("#button-land-to").removeClass('disabled');
            $("#button-defend-to").removeClass('disabled');
            $("#button-attack-planet").removeClass('disabled');
        });


        $('#modal-map-other-ship').on('hidden.bs.modal',function() {
            clean_modal();
            window.other_ship = undefined;
            $('#send-resources-button').off();
            $('#attack-button').off();
            $('#raid-button').off();
            $('#fire-cannon-button').off();
            $('#cannon-target').off();
            $('#attack-button').removeClass('disabled');
            $('#send-resources-button').removeClass('disabled');
            $('#raid-button').removeClass('disabled');
        });

        function canChangeMode() {
            if (window.blocks_to_mode == 0 && window.energyStock >= window.ENERGY_TO_CHANGE_MODE)
                return true;
            return false;
        }

        function setFleet() {
            if (window.fleet_type != 0)
                $('#fleet-type-name').text(CSSGame.getFleetType(window.fleet_type));
            else
                $('#fleet-type-name').text("Undesigned Fleet");
            $('#fleet-size').text(window.fleet_size.toString());
            if (window.blocks_to_fleet == 0) {
                if (window.fleet_size > 0) {
                    status = "Ready For Combat";
                }
                else {
                    status = "No Fleet Available";
                }
            }
            else {
                status = "Waiting For Fleet";
            }
            $('#fleet-status').text(status);

        }

        function setActualMode() {
            switch(window.mode) {
                case window.DEFAULT_MODE:
                    $('#button-default-mode').addClass("selected-mode");
                    break;
                case window.ATTACK_MODE:
                    $('#button-attack-mode').addClass("selected-mode");
                    break;
                case window.MOVEMMENT_MODE:
                    $('#button-movemment-mode').addClass("selected-mode");
                    break;
                case window.DEFENSE_MODE:
                    $('#button-defense-mode').addClass("selected-mode");
                    break;
            }
        }

        function setEventsCounter() {
            if (window.eventsCount > 0) {
                $('#events-alert').text(window.eventsCount);
            }
            else {
                $('#events-alert').text('');
            }
        }

        function renderView() 
        {
            setLocation();
            setActionCountdownBlocks();
            setResourcesStock();
            setMap(window.map);
            setFleet();
            setActualMode(window.mode);
            setEnergyForChangeMode();
            setEventsCounter();
            setDamage();
            setGameStats();
        }

        renderView();

        function setLocation() {
            $('#location-coord-x').text(window.position_x.toString());
            $('#location-coord-y').text(window.position_y.toString());
            $('#location-place').text("Open Crypto-Space");
        }

        function setResourcesStock() {
            try { 
                if (typeof window.energyStock !== 'undefined') 
                    $('#energy-stock').text(window.energyStock.toString());
                else 
                    throw "window.energyStock undefined";

                if (typeof window.grapheneStock !== 'undefined')
                    $('#graphene-stock').text(window.grapheneStock.toString());
                else
                    throw "window.grapheneStock undefined";

                if (typeof window.metalsStock !== 'undefined')
                    $('#metals-stock').text(window.metalsStock.toString());
                else
                    throw "window.metalsStock undefined";
            }
            catch(err) {
                if (window.DEBUG == true) {
                    window.alert(err)
                }
                else {
                    console.log(err);
                }
            }
        }

        function setEnergyForChangeMode() {
            let percentage = window.energyStock*100/window.ENERGY_TO_CHANGE_MODE;
            if (typeof percentage !== 'undefined') {
                if (percentage >100) 
                    strpercentage = '100%'
                else
                    strpercentage = percentage.toString()+'%'
                $('#amount-energy-mode').text(strpercentage);
                $('#bar-energy-mode').attr('style', 'width:' + strpercentage + ';');
            }
        }

        function setActionCountdownBlocks() {
            if (typeof window.blocks_to_move !== 'undefined')
                $('#blocks-to-move').text(window.blocks_to_move.toString());
            if (typeof window.blocks_to_fleet !== 'undefined')
                $('#blocks-to-fleet').text(window.blocks_to_fleet.toString());
            if (typeof window.blocks_to_fire !== 'undefined')
                $('#blocks-to-fire').text(window.blocks_to_fire.toString());
            if (typeof window.blocks_to_mode !== 'undefined')
                $('#blocks-to-mode').text(window.blocks_to_mode.toString());
        }
        
        function setMap() {
            let map = window.map;
            if (map.length != 51) {
                throw "Invalid Map size";
            }
            
            // Set center
            start_x = map[49];
            start_y = map[50];
            if (start_x < 0 || (window.map_size - start_x) < 7) {
                throw "Invalid start coord x";
            }

            if (start_y < 0 || (window.map_size - start_y) < 7) {
                throw "Invalid start coord y";
            }

            x = start_x;
            y = start_y;
            for ( i = 0; i <= 49-1; i++ ) {
                if ( i != 0 ) {
                    if ( (i % 7) == 0 ) {
                        y = start_y;
                        x = x + 1;
                        
                    }
                    else {
                        y = y + 1;
                        
                    }
                }
                htmlid = '#map_position_' + i.toString();
                if ( map[i] == 0 ) 
                    setMapSquare(htmlid,"empty",0,x,y);
                else {
                    if (CSSGame.isShip(map[i])) {
                        if ( map[i] == window.ship )
                            setMapSquare(htmlid,"ownship",map[i],x,y);
                        else
                            setMapSquare(htmlid,"ship",map[i],x,y);
                    }
                    else {
                        setMapSquare(htmlid,"planet",map[i],x,y);
                    }
                }
            }
            showMapArrows(start_x,start_y);
            $('[data-toggle="tooltip"]').tooltip();
        }    


        function setEmptyClassMapSquare() {
            function getRndInteger(min, max) {
                return Math.floor(Math.random() * (max - min + 1) ) + min;
            }
            let r = getRndInteger(1,48);
            if (r == 1 || r == 7) {
                let r2 = getRndInteger(1,4);
                if (r2 == 1)
                    return "panel empty_m1 p3d";
                if (r2 == 2)
                    return "panel empty_m2 p3d";
                if (r2 == 3)
                    return "panel empty_m3 p3d";
                if (r2 == 4)
                    return "panel empty_m4 p3d";
            }
            return "panel p3d";
        }


        function setMapSquare(id, object, objectId, x, y) {
            tooltip = false;
            $(id).attr("class","");
            $(id).removeAttr("data-toggle");
            $(id).removeAttr("data-placement");
            $(id).removeAttr("title");
            $(id).removeAttr("data-original-title");

            if (object === "planet") {
                strClass = "panel panel_planet p3d";
                tooltip = true;
                title = "Planet ID: " + objectId.toString();    
            }
            else if (object === "empty") {
                strClass = setEmptyClassMapSquare(); //"panel p3d";
            }
            else if (object === "ship") {
                strClass = "panel panel_ship p3d";
                tooltip = true;
                title = "Ship ID: " + objectId.toString();
            }
            else if (object === "ownship" ) {
                tooltip = true;
                strClass = "panel ownship p3d";
                title = window.shipName;                
            }
            else {
                throw "Invalid type";
            }
            $(id).addClass(strClass);
            if (tooltip) {
                $(id).attr("data-toggle", "tooltip");
                $(id).attr("data-placement", "top");
                $(id).attr("data-original-title", title);
            }
            $(id).attr("map-object-id", objectId.toString());
            $(id).attr("map-type", object);
            mapSetCoord(id,x,y);
        }
        
        function mapSetCoord(id,x,y) {
            $(id).attr("map-coord-x",x.toString());
            $(id).attr("map-coord-y",y.toString());
            $(id).text(x.toString()+','+y.toString());
        }

        setInterval(function() {
            window.cssgame.viewShipVars(window.ship,function(e,r) {
                if(!e) {
                    ret = window.cssgame.viewShipVarsResult(r);
                    window.energyStock = ret.energyStock;
                    window.grapheneStock = ret.grapheneStock;
                    window.metalsStock = ret.metalStock;
                    window.blocks_to_fire = ret.countdownToFireCannon;
                    window.blocks_to_mode = ret.countdownToMode;
                    window.blocks_to_move = ret.countdownToMove;
                    window.blocks_to_fleet = ret.countdownToFleet;
                    window.damage = ret.damage;
                    setResourcesStock();
                    setEnergyForChangeMode();
                    setActionCountdownBlocks();
                    setDamage();
                }
            });
            refreshMap();
        }, 5000);

        function mapArrayCmp(m) {
            let i;
            for ( i = 0; i <= m.length-1; i++ ) {
                if (m[i] != window.map[i])
                    return false;
            }
            return true;
        }


        var mapType="3D";
        $(".panel").addClass("p3d");// this adds 3d effect to panel hovering
        var myModalContent = "";
        /* tooltips */
            $('[data-toggle="tooltip"]').tooltip();
            
            $('[id=warehouse-load]').text(window.warehouseLoad);
        
        /************** Animations **************/
        
        var times = 0; // animation helper variable, this will increment/decrement for animation purposes
        var IntID; // serves as instance name for setIntervals
        
        // Introduce spaceShip
        // speed1 = fade in speed, spped2, size speed
            function mapFader(speed){
                $(".mapContainer").fadeIn(speed, function() {
                });
                
            }
        
        
        // perspective  click trigger
        $("#mapView").on("click", function(){
            if(mapType=="3D"){
                times = 47;
                var IntID = setTimer("to2D");
            }else{
                times = 0;
                var IntID = setTimer("to3D");
            }
        })
        
        //perspective function
        function to2D() { 
                $(".scene").css('transform','perspective(3000px) rotateX('+times+'deg) rotateZ('+times+'deg)');
                times--;
                if(times==0) {
                    stopTimer();
                    mapType="2D";
                    $(".scene").css('transform','perspective(0px)');
                    $(".panel").removeClass("p3d");
                }
        }
        
        function to3D(){ 
                    $(".scene").css('transform',' perspective(1700px) rotateX('+times+'deg) rotateZ('+times+'deg)');
                    times++;
                    if(times==47){
                    stopTimer();
                    mapType="3D";
                    $(".panel").addClass("p3d");
                    }
        }
        

            function setTimer(mode){
                if(mode=="to2D"){
                    console.log("cnahge to 2D!");
                    IntID = setInterval(to2D, 10);
                }else{
                    console.log("cnahge to 3D!");
                    IntID = setInterval(to3D, 10);
                }             
                
            }

            function stopTimer() {
                clearInterval(IntID);
            }
        
        // slide panels
        function panelSlide(panelid, speed, direction, amount){
            if(direction="left"){
                $("#"+panelid).animate({"margin-left": amount}, speed)
            }else{
                $("#"+panelid).animate({"margin-right": amount}, speed)
            }
            
        }
        
        // fill gauges gradually
        function fillCounters(id, amount, speed){
            $("#bar-"+id).animate({width: amount}, speed)
            $("#amount-"+id).text(amount);
        }
        
            
        
        
        // initialize screen
        
        function init(){
                $('#resources').show();
                $('#stats').show();
                mapFader(1000);
                panelSlide("resources", 1000, "left", "+=50%");           
                panelSlide("stats", 1000, "left", "-=50%");
            
        }
        
        
        // call initializing routine
        init();
    
    }); // init.init();

}); // window.addEventListener('load');