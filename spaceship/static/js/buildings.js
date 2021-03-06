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

        
        function check_pending_tx (tx) {
            /*
             * Se cierra el modal
             */
            setInterval(()=>{
                backend.txConfirmed(tx,function(e,h){
                    if (e == null) 
                        if (h.confirmed == true) location.reload(); 
                });
            },window.refresh_interval);
        }

        if (window.tx_pending.length != 0) {
            /*
             * Mostrar alerta
             */
            $('#link-to-explorer').attr('onclick', "window.parent.open('" + window.explorer_url + window.tx_pending[0] +  "', '_blank'); return false;");
            $('#modal-tx').modal('show');
            check_pending_tx(window.tx_pending[0]);
        }


        function setGameStats() {
            let noOwner = "0x0000000000000000000000000000000000000000";
            if (window.planetOwner != noOwner) {
                if (window.blocksToEnd < 0)
                    window.blocksToEnd = 0;
                $('#blocks-to-end').text(window.blocksToEnd);
                if (window.cssgame.w3.eth.accounts[0] != window.planetOwner) {
                    $('#end-status').text('LOSE');
                    $('#win-condition').text("LOSING");
                } else {
                    $('#end-status').text('WIN');
                    $('#win-condition').text("WINNING");
                }
                
                if (window.blocksToEnd == 0) {
                    $('#claim-victory').show();
                    $('#conquest-message').hide();
                }
                else {
                    $('#conquest-message').show();
                    $('#claim-victory').hide();
                }
    
            }
            $('#reward').text(window.reward/1000000000000000000);
            $('#game-age').text(window.gameAge);
            $('#players').text(window.players);
        }

        $('#range-load-points').attr('step', CSSGame.fleetLoadSteper(window.gameNetwork));
        $('#range-load-points').attr('max', CSSGame.fleetLoadSteper(window.gameNetwork)*100);

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
        },window.refresh_interval);

        function cancel_order() {
            $(window.id_modal_open).modal('hide');
            clean_modal();
        }

        function process_order (tx) {
            /*
             * Se cierra el modal
             */
            $(window.id_modal_open).modal('hide');
            setInterval(()=>{
                this.web3.eth.getTransactionReceipt(tx, function(e,h) {
                    if (h && h.blockNumber != null) location.reload();
                });
            }, window.refresh_interval);

            backend.txCreate(window.game,tx,window.tx_group);

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
        }

        if (window.fleetType != "" && window.fleetEnergyCost != 0 && window.fleetGrapheneCost != 0 && window.fleetMetalsCost != 0)
            window.fleetDesigned = true;
        else
            window.fleetDesigned = false; 


            $('#range-attack-points').on('input', function(){
                $('#attack-design-points').text(this.value);
                checkDesignPoints();
            });

            $('#range-defense-points').on('input', function(){
                $('#defense-design-points').text(this.value);
                checkDesignPoints();
            });

            $('#range-distance-points').on('input', function(){
                $('#distance-design-points').text(this.value);
                checkDesignPoints();
            });

            $('#range-load-points').on('input', function(){
                $('#load-design-points').text(this.value);
                checkDesignPoints();
            });

            if ( window.fleetSize > 0 && window.fleetQueue == 0) {
                $('#disassemble-fleet').show();
            }
            else {
                $('#disassemble-fleet').hide();
            }

            $('#disassemble-fleet').click(function() {
                $('#modal-disassemble-fleet').modal('show');
                window.id_modal_open = '#modal-disassemble-fleet';
                max = window.fleetSize;
                $('#range-disassemble-fleet').attr('max', max);                
                $('#max-fleet-to-disassemble').text(max);

                $('#button-disassemble-fleet').addClass('disabled'); 

                $('#range-disassemble-fleet').on('input', function(){
                    let r = window.cssgame.calcReturnResourcesFromFleet(
                        window.hangarLevel, 
                        window.fleetAttack, 
                        window.fleetDefense, 
                        window.fleetDistance, 
                        window.fleetLoad, this.value);
                    $('#fleet-to-disassemble').text(this.value);
                    $('#graphene-disassemble-fleet').text(r.graphene);
                    $('#metals-disassemble-fleet').text(r.metals);
                    window.fleet_to_disassemble = this.value;
                    if (window.fleet_to_disassemble > 0)
                        $('#button-disassemble-fleet').removeClass('disabled');
                    else
                        $('#button-disassemble-fleet').addClass('disabled');
                });

                $('#button-disassemble-fleet').click(function() {
                    if (typeof window.fleet_to_disassemble != 'undefined' && window.fleet_to_disassemble > 0) {
                        $('#button-disassemble-fleet').off();

                        // Priero se Cierra el Modal 
                        $(window.id_modal_open).modal('hide');
                        // Luego se abre el otro modal
                        window.id_modal_open = '#modal-waiting-confirm';

                        $(window.id_modal_open).modal('show');
                        window.cssgame.disassembleFleet(window.ship,window.fleet_to_disassemble,function(e,h){
                            if (!e) 
                                process_order(h);
                            else
                                cancel_order();
                            window.fleet_to_disassemble = 0;
                        });
                    }
                });
            });


            $('#modal-disassemble-fleet').on('hidden.bs.modal', function () {
                $('#button-disassemble-fleet').off();
                $('#fleet-to-disassemble').text(0);
                $('#range-disassemble-fleet').val(0);  
                $('#max-fleet-to-disassemble').text(max);
                $('#graphene-disassemble-fleet').text(0);
                $('#metals-disassemble-fleet').text(0);
            });

            function checkDesignPoints() {
                let design = {};
                let points;
                let cost;

                design.attack = parseInt($('#range-attack-points').val());
                design.defense = parseInt($('#range-defense-points').val());
                design.distance = parseInt($('#range-distance-points').val());
                design.load = parseInt($('#range-load-points').val());
                design.points = design.attack + design.defense + design.distance * 6 + design.load / CSSGame.fleetLoadSteper(window.gameNetwork);
                points = window.qaim[0] + CSSGame.getPointsByHangarLevel(window.hangarLevel) - design.points;
                $('#available-design-points').text(points);
                if (points >= 0) {
                    $('#available-design-points').css("color", "rgb(0, 232, 123)");
                    $('#fleet-type-design').text(CSSGame.getFleetType(design.attack,design.defense,design.distance,design.load, window.gameNetwork));
                    cost = window.cssgame.getFleetCost(design.attack,design.defense,design.distance,design.load,window.qaim[3]);
                    cost.valid = true;
                }
                else {
                    $('#available-design-points').css("color", "rgba(232,0,87,1)");
                    $('#fleet-type-design').text("ERROR");
                    cost = {};
                    cost.energy = 0;
                    cost.graphene = 0;
                    cost.metals = 0;
                    cost.valid = false;
                }
                $('#energy-cost').text(cost.energy);
                $('#graphene-cost').text(cost.graphene);
                $('#metals-cost').text(cost.metals);

                // Disable handler
                $('#button-design-fleet').off();
                if (cost.valid) {
                    $('#button-design-fleet').removeClass('disabled');
                    window.designCost = cost;
                    window.design = design;
                    // Configurar el handler para mandar a diseñar
                    $('#button-design-fleet').click(function(){
                                    // Priero se Cierra el Modal 
                        $(window.id_modal_open).modal('hide');
                        // Luego se abre el otro modal
                        window.id_modal_open = '#modal-waiting-confirm';

                        $(window.id_modal_open).modal('show');
                        window.cssgame.designFleet(window.ship,window.design.attack,window.design.defense,window.design.distance,window.design.load,function(e,h){
                            if (!e) 
                                process_order(h);
                            else
                                cancel_order();
                        });
                    });
                } else {
                    $('#button-design-fleet').addClass('disabled');
                }

            }


            $('#upgrade-warehouse-ready').click(function() {
                // Get Values
                nextLevel = window.warehouseLevel+1;
                gRes = window.cssgame.getUpgradeBuildingCost(0,nextLevel,window.qaim[2]);
                // Render HTML
                $('#next-warehouse-level').text(nextLevel);
                $('#energy-warehouse-upgrade').text(gRes.energy);
                $('#graphene-warehouse-upgrade').text(gRes.graphene);
                $('#metals-warehouse-upgrade').text(gRes.metals);
                
                // Finally Show the Modal
                window.id_modal_open = '#modal-warehouse-upgrade';
                $(window.id_modal_open).modal('show');
            });

            $('#upgrade-hangar-ready').click(function() {
                // Get Values
                nextLevel = window.hangarLevel+1;
                gRes = window.cssgame.getUpgradeBuildingCost(1,nextLevel,window.qaim[2]);
                // Render HTML
                $('#next-hangar-level').text(nextLevel);
                $('#energy-hangar-upgrade').text(gRes.energy);
                $('#graphene-hangar-upgrade').text(gRes.graphene);
                $('#metals-hangar-upgrade').text(gRes.metals);
                
                // Finally Show the Modal
                window.id_modal_open = '#modal-hangar-upgrade';
                $(window.id_modal_open).modal('show');
            });

            $('#upgrade-wopr-ready').click(function() {
                // Get Values
                nextLevel = window.woprLevel+1;
                mRes = window.cssgame.getUpgradeBuildingCost(2,nextLevel,window.qaim[2]);

                if (window.woprLevel == 0) {

                    window.id_modal_open = '#modal-wopr-upgrade-first';
                    window.role_selected = undefined;

                    $('#energy-wopr-upgrade-ft').text(mRes.energy);

                    $('#graphene-wopr-upgrade-ft').text(mRes.graphene);

                    $('#metals-wopr-upgrade-ft').text(mRes.metals);

                } else {

                    window.id_modal_open = '#modal-wopr-upgrade';
                    $('#next-wopr-level').text(nextLevel);
                    $('#energy-wopr-upgrade').text(mRes.energy);
                    $('#graphene-wopr-upgrade').text(mRes.graphene);
                    $('#metals-wopr-upgrade').text(mRes.metals);
                    switch(window.role) {
                        case 3:
                            $('#wopr-role').text('Reparer');
                            break;
                        case 2:
                            $('#wopr-role').text('Resource Converter');
                            break;
                        case 1:
                            $('#wopr-role').text('Crypto Ion-Cannon');
                            break;
                    }

                }
                // Finally Show the Modal

                $(window.id_modal_open).modal('show');
            });


            $('#modal-wopr-upgrade-first').on('hidden.bs.modal', function () {
                window.role_selected = undefined;
            });


            $('#upgrading-warehouse').click(function() {
                modal_upgrading();
            });
            
            $('#upgrading-hangar').click(function () {
                modal_upgrading();
            });

            $('#upgrading-wopr').click(function() {
                modal_upgrading();
            });

            
            // Claim victory
            $('#claim-victory').click(()=>{
                window.cssgame.claimVictory((e,g)=>{
                    if (!e) {
                        process_order (h);
                    }    
                });
            });

            function modal_upgrading () {
                if (window.buildingUpgrading == 1)
                    text = 'Warehouse at level ' + (window.warehouseLevel + 1).toString();

                if (window.buildingUpgrading == 2)
                    text = 'Hangar at level ' + (window.hangarLevel+1).toString();

                if (window.buildingUpgrading == 3)
                    text = 'wopr at level ' + (window.woprLevel+1).toString();

                $('#building-upgrading').text(text);
                $('#modal-upgrading').modal('show');
            }

            
            $('#modal-upgrading').on('hidden.bs.modal', function() {
                $('#resource-upgrading').text('');
            });

            $('#button-upgrade-wopr').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.cssgame.upgradeWopr(window.ship,window.role,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });

            $('#converter-selected').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.role_selected = 2;
                window.cssgame.upgradeWopr(window.ship,window.role_selected,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });

            $('#cannon-selected').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.role_selected = 1;
                window.cssgame.upgradeWopr(window.ship,window.role_selected,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });

            $('#reparer-selected').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.role_selected = 3;
                window.cssgame.upgradeWopr(window.ship,window.role_selected,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });
            

            $('#button-upgrade-hangar').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.cssgame.upgradeHangar(window.ship,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });

            $('#button-upgrade-warehouse').click(function() {
                // Priero se Cierra el Modal 
                $(window.id_modal_open).modal('hide');
                // Luego se abre el otro modal
                window.id_modal_open = '#modal-waiting-confirm';

                $(window.id_modal_open).modal('show');
                window.cssgame.upgradeWarehouse(window.ship,function(e,h){
                    if (!e) 
                        process_order(h);
                    else
                        cancel_order();
                });
            });

            /*
            * Todas las condiciones para ver si se puede 
            * diseñar una flota
            */
            if (window.fleetSize == 0 && window.fleetQueue == 0 && window.hangarLevel > 0) {
                $('#design-fleet-ready').click(function(){
                    $('#attack-design-points').text(window.fleetAttack);
                    $('#defense-design-points').text(window.fleetDefense);
                    $('#distance-design-points').text(window.fleetDistance);
                    $('#load-design-points').text(window.fleetLoad);

                    $('#range-attack-points').val(window.fleetAttack);
                    $('#range-defense-points').val(window.fleetDefense);
                    $('#range-distance-points').val(window.fleetDistance);
                    $('#range-load-points').val(window.fleetLoad);

                    checkDesignPoints();
                    // Finally Show de Modal
                    window.id_modal_open = '#modal-design-fleet';
                    $(window.id_modal_open).modal('show');
                });
            }
            else {
                $('#design-fleet-ready').hide();
            }
            $('#modal-design-fleet').on('hidden.bs.modal', function () {
                let cost = {};
                let design = {};
                cost.e = 0;
                cost.g = 0;
                cost.m = 0;
                cost.valid = false;
                window.designCost = cost;
                window.design = design;
            });

            /*
            * La condicion para saber si puede construir una flota
            */
            if (window.energyProduction > 0 && 
                window.fleetDesigned == true &&
                window.blocksToEndProduction == 0 &&
                window.fleetEnergyCost != 0 &&
                window.fleetGrapheneCost != 0 &&
                window.hangarLevel > 0 &&
                window.fleetMetalsCost != 0) {
                $('#build-fleet-ready').click(function(){
                    let max = calcBuildFleet();
                    $('#range-build-fleet').attr('max',max);
                    $('#max-fleet-to-build').text(max);

                    window.id_modal_open = '#modal-build-fleet';
                    $(window.id_modal_open).modal('show');
                });
            }
            else {
                $('#build-fleet-ready').hide();
            }

            $('#button-build-fleet').click(function(){
                let value = parseInt($('#range-build-fleet').val());
                if (value > 0) {
                    // Priero se Cierra el Modal 
                    $(window.id_modal_open).modal('hide');
                    // Luego se abre el otro modal
                    window.id_modal_open = '#modal-waiting-confirm';

                    $(window.id_modal_open).modal('show');

                    window.cssgame.buildFleet(window.ship,value,function(e,h){
                        if (!e) 
                            process_order(h);
                        else
                            cancel_order();
                    });
                }
            });

            $('#modal-build-fleet').on('hidden.bs.modal', ()=> {
                $('#button-build-fleet').addClass('disabled');
                $('#range-build-fleet').val(0);
                $('#fleet-to-build').text(0);
                $('#energy-build-fleet').text(0);
                $('#graphene-build-fleet').text(0);
                $('#metals-build-fleet').text(0);
            });

            $('#range-build-fleet').on('input', function(){
                let size = parseInt(this.value);
                let r = calcFleetCost(size);
                $('#fleet-to-build').text(size);
                $('#energy-build-fleet').text(r.energy);
                $('#graphene-build-fleet').text(r.graphene);
                $('#metals-build-fleet').text(r.metals);
                if (size > 0 )
                    $('#button-build-fleet').removeClass('disabled');
                else
                    $('#button-build-fleet').addClass('disabled');
            });

            function calcBuildFleet() {
                let min;
                min = window.energyStock / window.fleetEnergyCost;

                if (window.grapheneStock / window.fleetGrapheneCost < min)
                    min = window.grapheneStock / window.fleetGrapheneCost;
                if (window.metalsStock / window.fleetMetalsCost < min)
                    min = window.metalsStock / window.fleetMetalsCost;
                if (window.energyProduction < min)
                    min = window.energyProduction;

                return Math.floor(min);
            }

            function calcFleetCost(size) {
                let ret = {};
                ret.energy = window.fleetEnergyCost * size;
                ret.graphene = window.fleetGrapheneCost * size;
                ret.metals = window.fleetMetalsCost * size;
                return ret;
            }


            function checkBuildingUpgrade() {
                if (window.warehouseLevel < 4) {
                    if (window.buildingUpgrading == 1 && window.buildingBlock != 0) 
                        setUpgradeResourceBar(0, window.warehouseLevel + 2);
                    else
                        setUpgradeResourceBar(0, window.warehouseLevel + 1);         
                }
                if (window.hangarLevel < 4) {
                    if (window.buildingUpgrading == 2 && window.buildingBlock != 0) 
                        setUpgradeResourceBar(1, window.hangarLevel + 2);
                    else
                        setUpgradeResourceBar(1, window.hangarLevel + 1);
                }
                if (window.woprLevel < 4) {
                    if (window.buildingUpgrading == 3 && window.buildingBlock != 0) 
                        setUpgradeResourceBar(2, window.woprLevel + 2);
                    else
                        setUpgradeResourceBar(2, window.woprLevel + 1);
                }
                if (window.buildingUpgrading > 0 && window.buildingUpgrading <= 3 && window.buildingBlock != 0) {
                    if (window.buildingUpgrading == 1) {
                        setUpgradeBuildingReady(0,2);
                        setUpgradeBuildingReady(1,1);
                        setUpgradeBuildingReady(2,1);    
                    } else {
                        if (window.buildingUpgrading == 2 ) {
                            setUpgradeBuildingReady(1,2);
                            setUpgradeBuildingReady(0,1);
                            setUpgradeBuildingReady(2,1);
                        } else {
                            setUpgradeBuildingReady(0,1);
                            setUpgradeBuildingReady(1,1);
                            setUpgradeBuildingReady(2,2);
                        }
                    }
                } else {
                    if (window.warehouseLevel < 4) {
                        eRes = window.cssgame.getUpgradeBuildingCost(0,window.warehouseLevel+1,window.qaim[2]);
                        if ( eRes.energy <= window.energyStock && 
                            eRes.graphene <= window.grapheneStock && 
                            eRes.metals <= window.metalsStock && 
                            window.buildingBlock == 0)
                            setUpgradeBuildingReady(0,0);
                        else
                            setUpgradeBuildingReady(0,1);
                    } else {
                        setUpgradeBuildingReady(0,1);
                    }

                    if (window.hangarLevel < 4) {
                        // Building 1 is Hangar
                        gRes = window.cssgame.getUpgradeBuildingCost(1,window.hangarLevel+1,window.qaim[2]);
                        if ( gRes.energy <= window.energyStock && 
                            gRes.graphene <= window.grapheneStock && 
                            gRes.metals <= window.metalsStock && 
                            window.buildingBlock == 0)
                            setUpgradeBuildingReady(1,0);
                        else
                            setUpgradeBuildingReady(1,1);
                    } else {
                        setUpgradeBuildingReady(1,1);
                    }
                    
                    if (window.woprLevel < 4) {
                        mRes = window.cssgame.getUpgradeBuildingCost(2,window.woprLevel+1,window.qaim[2]);
                        
                        if ( mRes.energy <= window.energyStock && 
                            mRes.graphene <= window.grapheneStock && 
                            mRes.metals <= window.metalsStock && 
                            window.buildingBlock == 0)
                            setUpgradeBuildingReady(2,0);
                        else
                            setUpgradeBuildingReady(2,1);
                    } else {
                        setUpgradeBuildingReady(2,1);
                    }
                }


            }

            function setUpgradeBuildingReady(building, show_type) {
                switch(building) {
                    case 0:
                        id_ready = "#upgrade-warehouse-ready";
                        id_upgrading = "#upgrading-warehouse";
                        if (show_type == 0) {
                            // Upgrade Ready
                            $(id_ready).show();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 1) {
                            // No upgrade
                            $(id_ready).hide();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 2) {
                            // Upgrading
                            $(id_ready).hide();
                            $(id_upgrading).show();
                            return;
                        }
                        break;
                    case 1:
                        id_ready = "#upgrade-hangar-ready";
                        id_upgrading = "#upgrading-hangar";
                        if (show_type == 0) {
                            // Upgrade Ready    
                            $(id_ready).show();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 1) {
                            // No upgrade
                            $(id_ready).hide();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 2) {
                            // Upgrading
                            $(id_ready).hide();
                            $(id_upgrading).show();
                            return;
                        }
                        break;
                    case 2:
                        id_ready = "#upgrade-wopr-ready";
                        id_upgrading = "#upgrading-wopr";
                        if (show_type == 0) {
                            // Upgrade Ready    
                            $(id_ready).show();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 1) {
                            // No upgrade
                            $(id_ready).hide();
                            $(id_upgrading).hide();
                            return;
                        }
                        if (show_type == 2) {
                            // Upgrading
                            $(id_ready).hide();
                            $(id_upgrading).show();
                            return;
                        }
                        break;
                }
            }

            function setBuildingLevel() {
                $('#warehouse-level').text(window.warehouseLevel);
                $('#hangar-level').text(window.hangarLevel);
                $('#wopr-level').text(window.woprLevel);
            }

            function setUpgradeResourceBar(resource,level)
            {
                res = window.cssgame.getUpgradeBuildingCost(resource,level,window.qaim[2]);        
                energy = Math.floor(window.energyStock * 100 / res.energy);
                graphene = Math.floor(window.grapheneStock * 100 / res.graphene);
                metals = Math.floor(window.metalsStock * 100 / res.metals);
                let max_level = 0
                
                if (energy > 100) energy = 100;
                if (graphene > 100) graphene = 100;
                if (metals > 100) metals = 100;

                switch (resource) {
                    case 0:
                        bar_energy = '#bar-energy1';
                        amount_energy = '#amount-energy1';
                        bar_graphene = '#bar-graphene1';
                        amount_graphene = '#amount-graphene1';
                        bar_metals = '#bar-metals1';
                        amount_metals = '#amount-metals1';
                        max_level = 4;
                        break;
                    case 1:
                        bar_energy = '#bar-energy2';
                        amount_energy = '#amount-energy2';
                        bar_graphene = '#bar-graphene2';
                        amount_graphene = '#amount-graphene2';
                        bar_metals = '#bar-metals2';
                        amount_metals = '#amount-metals2';
                        max_level = 4;
                        break;
                    case 2:
                        bar_energy = '#bar-energy3';
                        amount_energy = '#amount-energy3';
                        bar_graphene = '#bar-graphene3';
                        amount_graphene = '#amount-graphene3';
                        bar_metals = '#bar-metals3';
                        amount_metals = '#amount-metals3';
                        max_level = 2;
                        break;
                }
                if (level <= max_level) {
                    $(amount_energy).text(energy.toString()+'%');
                    $(amount_graphene).text(graphene.toString()+'%');
                    $(amount_metals).text(metals.toString()+'%');
                }
                else {
                    $(amount_energy).text('');
                    $(amount_graphene).text('');
                    $(amount_metals).text('');
                }
                $(bar_energy).attr("style", "width:" + energy.toString() + '%');
                $(bar_graphene).attr("style", "width:" + graphene.toString() + '%');
                $(bar_metals).attr("style", "width:" + metals.toString() + '%');
            }

            function setResourcesStock()
            {    
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

            // No Va

            function setCountdown()
            {
                $('#blocks-to-build').text(window.buildingBlock);
            }

            function setEventsCounter() {
                if (window.eventsCount > 0) {
                    $('#events-alert').text(window.eventsCount);
                }
                else {
                    $('#events-alert').text('');
                }
            }

            function setShip()
            {
                $('#ship-name').text(window.shipName);
            }

            function setFleet()
            {
                if (window.fleetDesigned == true) {
                    $('#fleet-type').text(CSSGame.getFleetTypeName(window.fleetType));
                }
                else {
                    $('#fleet-type').text("No Designed");
                }
                $('#fleet-size').text(window.fleetSize);
                $('#fleet-attack').text(window.fleetAttack);
                $('#fleet-defense').text(window.fleetDefense);
                $('#fleet-distance').text(window.fleetDistance);
                $('#fleet-load').text(window.fleetLoad);
                $('#fleet-queue').text(window.fleetQueue);
                $('#blocks-to-fleet-ends').text(window.blocksToEndProduction);
            }

            function getUpgradeBuildingsCost()
            {
                let warehouseCost = window.cssgame.getUpgradeBuildingCost(0, window.warehouseLevel+1,window.qaim[2]);
                let hangarCost = window.cssgame.getUpgradeBuildingCost(1, window.hangarLevel+1,window.qaim[2]);
                let woprCost = window.cssgame.getUpgradeBuildingCost(2, window.woprLevel+1,window.qaim[2]);
                
                if (window.warehouseLevel < 4) {                    
                    $('#warehouse-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(warehouseCost.energy).toString());
                    $('#warehouse-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(warehouseCost.graphene).toString());
                    $('#warehouse-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(warehouseCost.metals).toString());
                }
                else {
                    $('#warehouse-energy-tooltip').attr('data-original-title', 'Warehouse max level reached');
                    $('#warehouse-graphene-tooltip').attr('data-original-title', 'Warehouse max level reached');
                    $('#warehouse-metals-tooltip').attr('data-original-title', 'Warehouse max level reached');
                }
                
                if (window.hangarLevel < 4) {
                    $('#hangar-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(hangarCost.energy).toString());
                    $('#hangar-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(hangarCost.graphene).toString());
                    $('#hangar-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(hangarCost.metals).toString());
                }
                else {
                    $('#hangar-energy-tooltip').attr('data-original-title', 'Hangar max level reached');
                    $('#hangar-graphene-tooltip').attr('data-original-title', 'Hangar max level reached');
                    $('#hangar-metals-tooltip').attr('data-original-title', 'Hangar max level reached');
                }
                
                if (window.woprLevel < 2) {
                    $('#wopr-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(woprCost.energy).toString());
                    $('#wopr-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(woprCost.graphene).toString());
                    $('#wopr-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(woprCost.metals).toString());
                }
                else {
                    $('#wopr-energy-tooltip').attr('data-original-title', 'wopr max level reached');
                    $('#wopr-graphene-tooltip').attr('data-original-title', 'wopr max level reached');
                    $('#wopr-metals-tooltip').attr('data-original-title', 'wopr max level reached');
                }
            }



            
            setResourcesStock();
            checkBuildingUpgrade();
            setCountdown();
            setShip();
            setDamage();
            setGameStats();
            setBuildingLevel();
            setFleet();
            setEventsCounter();
            getUpgradeBuildingsCost();

            setInterval(function() {
                window.cssgame.viewShipVars(window.ship,function(e,r) {
                    if(!e) {
                        ret = window.cssgame.viewShipVarsResult(r);
                        window.energyStock = ret.energyStock;
                        window.grapheneStock = ret.grapheneStock;
                        window.metalsStock = ret.metalStock;
                        if (window.buildingBlock != 0 && ret.countdownToUpgradeBuildings == 0)
                            location.reload();
                        window.buildingBlock = ret.countdownToUpgradeBuildings;
                        window.damage = ret.damage;
                        setDamage();
                        setResourcesStock();
                        checkBuildingUpgrade();
                        setCountdown();
                    }
                });

                window.cssgame.viewFleet(window.ship,function(e,r) {
                    if(!e) {
                        ret = window.cssgame.viewFleetResult(r);
                        window.fleetSize = ret.size;
                        window.fleetQueue = ret.inProduction;
                        if (window.blocksToEndProduction != 0 && ret.blocksToEndProduction == 0)
                            location.reload();
                        window.blocksToEndProduction = ret.blocksToEndProduction;
                        setFleet();
                    }
                });
            }, window.refresh_interval);


            /* tooltips */
            $('[data-toggle="tooltip"]').tooltip();
            
            $('[id=warehouse-load]').text(window.warehouseLoad);

            if (window.qaim[2] != 0) {
                $('.qaim-bonus-2').show();
                $("[id='qaim-building-bonus']").text(window.qaim[2]);
            }

            if (window.qaim[3] != 0) {
                $('.qaim-bonus-3').show();
                $("[id='qaim-fleet-improve-bonus']").text(window.qaim[3]);
            }

            if (window.qaim[0] != 0) {
                $('.qaim-bonus-0').show();
                $('#qaim-fleet-bonus').text(window.qaim[0]);
            }
    

            function woprTexts(){
                let role
                let tooltip
                switch(window.role){
                case 1:
                    role = "Crypto Ion-Cannon";
                    tooltip = "Use the cannon to damage enemy spaceships or destroy their constructions.";
                    break;
                case 2:
                    role = "Resource Converter";
                    tooltip = "Use the Converter to obtain scarce rosources from leftovers.";
                    break;
                case 3:
                    role = "Reparer";
                    tooltip = "Use the reparer to repair your own spacechip or other friendly spaceships.";
                    break;
                default:
                    role = "Unselected Role";
                    tooltip = "Upgrade level of W.O.R.P and choose one of the available roles.";
                }
                $("#wopr-role-name").text(role);
                $("#wopr-tooltip").attr("data-original-title", tooltip);
            }
        
            // slide panels
            function panelSlide(panelid, speed, direction, amount){
                if(direction="left"){
                    $("#"+panelid).animate({"margin-left": amount}, speed)
                }else{
                    $("#"+panelid).animate({"margin-right": amount}, speed)
                }   
                }

            // initialize screen
            
            function init(){
                $('#resources').show();
                $('#stats').show();
                panelSlide("resources", 1000, "left", "+=50%"); 
                panelSlide("stats", 1000, "left", "-=50%");
                $("#wopr-tooltip").attr("title", "new title value");
                woprTexts();
            }
            
            
            // call initializing routine
            init();

    });
});