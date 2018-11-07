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
        window.cssgame = new CSSGame(this.web3,window.gameAbi,window.gameAddress);
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

        function process_order (order, tx) {
            /*
             * Se cierra el modal
             */
            $(window.id_modal_open).modal('hide');
            setInterval(()=>{
                this.web3.eth.getTransactionReceipt(tx, function(e,h){
                    if (h && h.blockNumber != null) location.reload();
                });
            },3000);
            $('#link-to-explorer').attr('href', window.explorer_url + tx);
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
                $('#button-disassemble-fleet').click(function() {
                    window.cssgame.disassembleFleet(window.ship,function(e,h){
                        if (!e) 
                            process_order("disassemble_fleet",h);
                    });
                });
            });

            $('#modal-disassemble-fleet').on('hidden.bs.modal', function () { 
                window.id_modal_open = undefined;
            });

            function checkDesignPoints() {
                let design = {};
                let points;
                let cost;

                design.attack = parseInt($('#range-attack-points').val());
                design.defense = parseInt($('#range-defense-points').val());
                design.distance = parseInt($('#range-distance-points').val());
                design.load = parseInt($('#range-load-points').val());
                design.points = design.attack + design.defense + design.distance * 6 + design.load / 80;
                points = 100 - design.points;
                $('#available-design-points').text(points);
                if (points >= 0) {
                    $('#available-design-points').css("color", "rgb(0, 232, 123)");
                    $('#fleet-type-design').text(CSSGame.getFleetType(design.attack,design.defense,design.distance,design.load));
                    cost = CSSGame.getFleetCost(design.attack,design.defense,design.distance,design.load);
                }
                else {
                    $('#available-design-points').css("color", "rgba(232,0,87,1)");
                    $('#fleet-type-design').text("ERROR");
                    cost = {};
                    cost.e = 0;
                    cost.g = 0;
                    cost.m = 0;
                    cost.valid = false;
                }
                $('#energy-cost').text(cost.e);
                $('#graphene-cost').text(cost.g);
                $('#metals-cost').text(cost.m);

                // Disable handler
                $('#button-design-fleet').off();
                if (cost.valid) {
                    window.designCost = cost;
                    window.design = design;
                    // Configurar el handler para mandar a diseñar
                    $('#button-design-fleet').click(function(){
                        window.cssgame.designFleet(window.ship,window.design.attack,window.design.defense,window.design.distance,window.design.load,function(e,h){
                        if (!e) 
                            process_order("design_fleet",h);
                        });
                    });
                }
            }


            $('#upgrade-warehouse-ready').click(function() {
                // Get Values
                nextLevel = window.warehouseLevel+1;
                gRes = CSSGame.getUpgradeBuildingCost(0,nextLevel);
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
                gRes = CSSGame.getUpgradeBuildingCost(1,nextLevel);
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
                mRes = CSSGame.getUpgradeBuildingCost(2,nextLevel);
                // Render HTML
                $('#next-wopr-level').text(nextLevel);
                $('#energy-wopr-upgrade').text(mRes.energy);
                $('#graphene-wopr-upgrade').text(mRes.graphene);
                $('#metals-wopr-upgrade').text(mRes.metals);
                
                // Finally Show the Modal
                window.id_modal_open = '#modal-wopr-upgrade';
                $(window.id_modal_open).modal('show');
            });

            $('#modal-warehouse-upgrade').on('hidden.bs.modal', function () { 
                window.id_modal_open = undefined;
            });

            $('#modal-hangar-upgrade').on('hidden.bs.modal', function () { 
                window.id_modal_open = undefined;
            });

            $('#modal-wopr-upgrade').on('hidden.bs.modal', function () { 
                window.id_modal_open = undefined;
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
                window.cssgame.upgradewopr(window.ship,function(e,h){
                    if (!e) 
                        process_order("upgrade_wopr",h);
                });
            });
            $('#button-upgrade-hangar').click(function() {
                window.cssgame.upgradeHangar(window.ship,function(e,h){
                    if (!e) 
                        process_order("upgrade_hangar",h);
                });
            });
            $('#button-upgrade-warehouse').click(function() {
                window.cssgame.upgradeWarehouse(window.ship,function(e,h){
                    if (!e) 
                        process_order("upgrade_warehouse",h);
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
                window.id_modal_open = undefined;
            });

            /*
            * La condicion para saber si puede construir una flota
            */
            if (window.energyProduction > 0 && 
                window.fleetDesigned == true &&
                window.blocksToEndProduction == 0 &&
                window.fleetEnergyCost != 0 &&
                window.fleetGrapheneCost != 0 &&
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

            $('#modal-build-fleet').on('hidden.bs.modal', function () {
                window.id_modal_open = undefined;
            });

            $('#button-build-fleet').click(function(){
                let value = parseInt($('#range-build-fleet').val());
                if (value > 0) {
                    window.cssgame.buildFleet(window.ship,value,function(e,h){
                        if (!e) 
                            process_order("build_fleet",h);
                    });
                }
            });

            $('#range-build-fleet').on('input', function(){
                let size = parseInt(this.value);
                let r = calcFleetCost(size);
                $('#fleet-to-build').text(size);
                $('#energy-build-fleet').text(r.energy);
                $('#graphene-build-fleet').text(r.graphene);
                $('#metals-build-fleet').text(r.metals);
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
                        eRes = CSSGame.getUpgradeBuildingCost(0,window.warehouseLevel+1);
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
                        gRes = CSSGame.getUpgradeBuildingCost(1,window.hangarLevel+1);
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
                        mRes = CSSGame.getUpgradeBuildingCost(2,window.woprLevel+1);
                        
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
                res = CSSGame.getUpgradeBuildingCost(resource,level);        
                energy = Math.floor(window.energyStock * 100 / res.energy);
                graphene = Math.floor(window.grapheneStock * 100 / res.graphene);
                metals = Math.floor(window.metalsStock * 100 / res.metals);

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
                        break;
                    case 1:
                        bar_energy = '#bar-energy2';
                        amount_energy = '#amount-energy2';
                        bar_graphene = '#bar-graphene2';
                        amount_graphene = '#amount-graphene2';
                        bar_metals = '#bar-metals2';
                        amount_metals = '#amount-metals2';
                        break;
                    case 2:
                        bar_energy = '#bar-energy3';
                        amount_energy = '#amount-energy3';
                        bar_graphene = '#bar-graphene3';
                        amount_graphene = '#amount-graphene3';
                        bar_metals = '#bar-metals3';
                        amount_metals = '#amount-metals3';
                        break;
                }
                if (level < 5) {
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
                let warehouseCost = CSSGame.getUpgradeBuildingCost(0, window.warehouseLevel+1);
                let hangarCost = CSSGame.getUpgradeBuildingCost(1, window.hangarLevel+1);
                let woprCost = CSSGame.getUpgradeBuildingCost(2, window.woprLevel+1);
                
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
                
                if (window.woprLevel < 4) {
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
                        window.blocksToEndProduction = ret.blocksToEndProduction;
                        setFleet();
                    }
                });
            }, 5000);

            /*
             * Check Events
             */ 
            setInterval(function() {
                backend.events.count(game,ship,function(e,r) {
                    if (!e) {
                        window.eventsCount = r.result.count;
                        setEventsCounter();
                    }
                });
            },5000);

                   /* tooltips */
            $('[data-toggle="tooltip"]').tooltip();
            
            $('[id=warehouse-load]').text(window.warehouseLoad);


        
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
            }
            
            
            // call initializing routine
            init();

    });
});