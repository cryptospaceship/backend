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

        for ( i = 1; i <= 12; i++ ) {
            panel = '#pe' + i.toString() + '-upgrade-ready';
            $(panel).click(function() {
                id = '#' + $(this).attr('id');
                upgradePanel($(id).attr('panel-number'));
            });
        }

        function upgradePanel(n) {
            i = parseInt(n);
            nextLevel = window.energyPanels[i-1]+1;

            eRes = window.cssgame.getUpgradeResourceCost(0,nextLevel,window.qaim[1]);
            // Render HTML
            $('#energy-energy-upgrade').text(eRes.energy);
            $('#graphene-energy-upgrade').text(eRes.graphene);
            $('#metals-energy-upgrade').text(eRes.metals);
            
            // Display Cost
            $('#button-upgrade-energy-panel').removeClass('disabled');
            $('#button-upgrade-energy-panel').off();
            $('#solar-panel-cost-index').text(i);
            $('#button-upgrade-energy-panel').click(function() {
                window.cssgame.upgradeEnergy(window.ship,i-1,function(e,h){
                    if (!e) 
                        process_order(h);
                });
            });
            $('.solar-panel-cost').css('display','flex');
        }

        // Handlers
        function energyModalHandler() {
            $('#button-upgrade-energy-panel').addClass('disabled');
            for (i = 1; i <= 12; i++ ) {
                id_prefix = '#pe' + i.toString();
                idPanelLevel = id_prefix + '-level';
                idDivUpgrade = id_prefix + '-upgrade-ready';
                idNextLevel  = id_prefix + '-nextLevel';
                $(idPanelLevel).text(window.energyPanels[i-1]);

                eRes = window.cssgame.getUpgradeResourceCost(0,window.energyPanels[i-1]+1,window.qaim[1]);
                if (eRes.energy <= window.energyStock && 
                    eRes.graphene <= window.grapheneStock && 
                    eRes.metals <= window.metalsStock && 
                    window.resourceBlock == 0) 
                {
                    $(idDivUpgrade).show();
                    $(idNextLevel).text(window.energyPanels[i-1]+1);
                }
                else {
                    $(idDivUpgrade).hide();
                }
            }
            // Finaly Show the Modal
            window.id_modal_open = '#modal-energy-upgrade';
            $('#modal-energy-upgrade').modal('show');
        }

        $('#upgrade-energy').click(function() {
            energyModalHandler();
        });

        // Claim victory
        $('#claim-victory').click(()=>{
            window.cssgame.claimVictory((e,g)=>{
                if (!e) {
                    process_order (h);
                }    
            });
        });

        $('#button-upgrade-graphene').click(function() {
            window.cssgame.upgradeGraphene(window.ship,function(e,h){
                if (!e) 
                    process_order(h);
            });
        });

        $('#button-upgrade-metals').click(function() {
            window.cssgame.upgradeMetals(window.ship,function(e,h){
                if (!e) 
                    process_order(h);
            });
        });

        $('#upgrade-energy-ready').click(function() {
            energyModalHandler();
        });

        $('#modal-energy-upgrade').on('hidden.bs.modal', function () {
            clean_modal();
            $('.solar-panel-cost').css('display','none');
            $('#button-upgrade-energy-panel').off();
            $('#button-upgrade-energy-panel').addClass('disabled');
        });

        /**
         * Resource Converter
         */
        $('#set-resource-converter').click(()=>{
            window.id_modal_open = '#modal-resource-converter';

            let graphene = cssgame.getProductionByLevel(window.grapheneCollectorLevel);
            let metal = cssgame.getProductionByLevel(window.metalsCollectorLevel);

            $('#range-metal-to-converter').val(window.mConverter);
            $('#range-graphene-to-converter').val(window.gConverter);
            $('#graphene-selected').text(window.gConverter);
            $('#metal-selected').text(window.mConverter);
            $('#energy-convertion').text(window.mConverter + window.gConverter);

            if (window.gConverter > 0 || window.mConverter > 0)
                $('#converter-status').text('Working');
            else
                $('#converter-status').text('Off');


            let checkvalues = ()=> {
                let g = $('#range-graphene-to-converter').val();
                let m = $('#range-metal-to-converter').val();
                $('#graphene-selected').text(g);
                $('#metal-selected').text(m);
                window.grapheneToConverter = parseInt(g);
                window.metalToConverter = parseInt(m);
                let e = cssgame.getProductionToConverter(g,m);
                $('#energy-convertion').text(e);
            }


            $('#range-graphene-to-converter').attr('max',graphene);
            $('#graphene-to-converter').text(graphene);
            $('#range-metal-to-converter').attr('max',metal);
            $('#metal-to-converter').text(metal);

            $('#range-graphene-to-converter').on('input',()=>{
                checkvalues();
                $('#button-convert-production').removeClass('disabled');
            });

            $('#range-metal-to-converter').on('input',()=>{
                checkvalues();
                $('#button-convert-production').removeClass('disabled');
            });

            $('#button-convert-production').click(()=>{
                if ( (typeof window.grapheneToConverter != 'undefined' && window.grapheneToConverter != window.gConverter) || (typeof window.metalToConverter != 'undefined' && window.metalToConverter != window.mConverter) ) {
                    window.cssgame.setProductionResourcesConverter(window.ship,window.grapheneToConverter,window.metalToConverter,(e,h)=>{
                        if (!e) {
                            process_order(h);
                        }
                    });
                }
            });
            $(window.id_modal_open).modal('show');
        });

        $('#modal-resource-converter').on('hidden.bs.modal',()=>{
            clean_modal();
            window.grapheneToConverter = 0;
            window.metalToConverter = 0;
            $('#button-convert-production').off();
            $('#range-metal-to-converter').off();
            $('#range-graphene-to-converter').off();
            $('#button-convert-production').addClass('disabled');
        });

        /**
         * Convertidor de Stock de recursos
         */
        $('#all-energy').click(()=>{
            $('#energy-resource-convertion').text(cssgame.getConvertionRate(window.energyStock,window.converterLevel));
            $('#energy-to-convert').val(window.energyStock);
        });

        $('#all-graphene').click(()=>{
            $('#graphene-resource-convertion').text(cssgame.getConvertionRate(window.grapheneStock,window.converterLevel));
            $('#graphene-to-convert').val(window.grapheneStock);
        });

        $('#all-metals').click(()=>{
            $('#metal-resource-convertion').text(cssgame.getConvertionRate(window.metalsStock,window.converterLevel));
            $('#metals-to-convert').val(window.metalsStock);
        });

        $('#convert-energy').click(()=>{
            window.convert_source = 0;
            window.id_modal_open = '#modal-convert-energy';
            $('#energy-to-convert').val(0);
            $('#convert-energy-to-graphene').prop('checked', false);
            $('#convert-energy-to-metals').prop('checked', false);

            $('#convert-energy-to-graphene').on('click',()=>{
                window.convert_destination = 1;
                $('#convert-energy-to-metals').prop('checked',false);
                $('#icon-energy-to-convertion').removeClass().addClass('icon-ratio ic-energy');
            });

            $('#convert-energy-to-metals').on('click',()=>{
                window.convert_destination = 2;
                $('#convert-energy-to-graphene').prop('checked', false);
                $('#icon-energy-to-convertion').removeClass().addClass('icon-ratio ic-metals');
            });

            $('#energy-to-convert').on('input', ()=>{
                let v = $('#energy-to-convert').val();
                $('#energy-resource-convertion').text(cssgame.getConvertionRate(v,window.converterLevel));
            });

            $('#button-convert-energy').on('click',()=>{
                n = parseInt($('#energy-to-convert').val());
                if (window.convert_destination != undefined && n > 0) {
                    window.cssgame.convertResource(window.ship,window.convert_source,window.convert_destination,n,(e,tx)=>{
                        if (!e)
                            process_order(tx);
                    });
                }
            });

            $(window.id_modal_open).modal('show');
        });

        $('#convert-graphene').click(()=>{
            window.convert_source = 1;
            window.id_modal_open = '#modal-convert-graphene';
            $('#graphene-to-convert').val(0);
            $('#convert-graphene-to-energy').prop('checked', false);
            $('#convert-graphene-to-metals').prop('checked', false);

            $('#convert-graphene-to-energy').on('click',()=>{
                window.convert_destination = 0;
                $('#convert-graphene-to-metals').prop('checked',false);
                $('#icon-graphene-to-convertion').removeClass().addClass('icon-ratio ic-energy');
            });

            $('#convert-graphene-to-metals').on('click',()=>{
                window.convert_destination = 2;
                $('#convert-graphene-to-energy').prop('checked', false);
                $('#icon-graphene-to-convertion').removeClass().addClass('icon-ratio ic-metals');
            });

            $('#graphene-to-convert').on('input', ()=>{
                let v = $('#graphene-to-convert').val();
                $('#graphene-resource-convertion').text(cssgame.getConvertionRate(v,window.converterLevel));
            });

            $('#button-convert-graphene').on('click',()=>{
                n = parseInt($('#graphene-to-convert').val());
                if (window.convert_destination != undefined && n > 0) {
                    window.cssgame.convertResource(window.ship,window.convert_source,window.convert_destination,n,(e,tx)=>{
                        if (!e)
                            process_order(tx);
                    });
                }
            });

            $(window.id_modal_open).modal('show');
        });


        $('#convert-metal').click(()=>{
            window.convert_source = 2;
            window.id_modal_open = '#modal-convert-metals';
            $('#metals-to-convert').val(0);
            $('#convert-metals-to-energy').prop('checked', false);
            $('#convert-metals-to-graphene').prop('checked', false);
            
            $('#convert-metals-to-energy').on('click',()=>{
                window.convert_destination = 0;
                $('#convert-metals-to-graphene').prop('checked', false);
                $('#icon-metals-to-convertion').removeClass().addClass('icon-ratio ic-energy');
            });

            $('#convert-metals-to-graphene').on('click',()=>{
                window.convert_destination = 1;
                $('#convert-metals-to-energy').prop('checked', false);
                $('#icon-metals-to-convertion').removeClass().addClass('icon-ratio ic-graphene');
            });

            $('#metals-to-convert').on('input', ()=>{
                let v = $('#metals-to-convert').val();
                $('#metal-resource-convertion').text(cssgame.getConvertionRate(v,window.converterLevel));
            });

            $('#button-convert-metals').on('click',()=>{
                n = parseInt($('#metals-to-convert').val());
                if (window.convert_destination != undefined && n > 0) {
                    window.cssgame.convertResource(window.ship,window.convert_source,window.convert_destination,n,(e,tx)=>{
                        if (!e)
                            process_order(tx);
                    });
                }
            });

            $(window.id_modal_open).modal('show');
        });

        $('#modal-convert-energy').on('hidden.bs.modal',()=>{
            window.convert_source = undefined;
            window.convert_destination = undefined;
            $('#energy-to-convert').val(0);
            $('#icon-energy-to-convertion').attr('class','');
            $('#convert-energy-to-metals').off();
            $('#convert-energy-to-energy').off();
            $('#button-energy-graphene').off();
            $('#energy-to-convert').off();
            $('#energy-resource-convertion').text(0);
            clean_modal();
        });

        $('#modal-convert-graphene').on('hidden.bs.modal',()=>{
            window.convert_source = undefined;
            window.convert_destination = undefined;
            $('#icon-graphene-to-convertion').attr('class','');
            $('#convert-graphene-to-metals').off();
            $('#convert-graphene-to-energy').off();
            $('#button-convert-graphene').off();
            $('#graphene-to-convert').val(0);
            $('#graphene-to-convert').off();
            $('#graphene-resource-convertion').text(0);
            clean_modal();
        });
        $('#modal-convert-metals').on('hidden.bs.modal',()=>{
            window.convert_source = undefined;
            window.convert_destination = undefined;
            $('#icon-metals-to-convertion').attr('class','');
            $('#button-convert-metals').off();
            $('#metals-to-convert').val(0);
            $('#convert-metals-to-graphene').off();
            $('#convert-metals-to-energy').off();
            $('#metals-to-convert').off();
            $('#metal-resource-convertion').text(0);
            clean_modal();
        });

        $('#upgrade-graphene-ready').click(function() {
            // Get Values
            nextLevel = window.grapheneCollectorLevel+1;
            gRes = window.cssgame.getUpgradeResourceCost(1,nextLevel,window.qaim[1]);
            // Render HTML
            $('#next-graphene-level').text(nextLevel);
            $('#energy-graphene-upgrade').text(gRes.energy);
            $('#graphene-graphene-upgrade').text(gRes.graphene);
            $('#metals-graphene-upgrade').text(gRes.metals);
            
            // Finally Show the Modal
            window.id_modal_open = '#modal-graphene-upgrade';
            $('#modal-graphene-upgrade').modal('show');
        });

        $('#modal-graphene-upgrade').on('hidden.bs.modal', function () {
            clean_modal();
        });

        $('#upgrading-energy').click(function() {
            modal_upgrading();
        });
        
        $('#upgrading-graphene').click(function () {
            modal_upgrading();
        });

        $('#upgrading-metals').click(function() {
            modal_upgrading();
        });
            
        
        function modal_upgrading () {
            if (window.resourceUpgrading > 0 && window.resourceUpgrading <= 6)
                text = 'Energy Panel ' + window.resourceUpgrading.toString() + ' at level ' + (window.energyPanels[window.resourceUpgrading-1] + 1).toString();

            if (window.resourceUpgrading == 7)
                text = 'Graphene Molecular Weaver at level ' + (window.grapheneCollectorLevel+1).toString();

            if (window.resourceUpgrading == 8)
                text = 'Metal Harvesting Module at level ' + (window.metalsCollectorLevel+1).toString();

            $('#resource-upgrading').text(text);
            $('#modal-upgrading').modal('show');
        }

        $('#modal-upgrading').on('hidden.bs.modal', function() {
            $('#resource-upgrading').text('');
        });

        $('#upgrade-metals-ready').click(function() {
            // Get Values
            nextLevel = window.metalsCollectorLevel+1;
            mRes = window.cssgame.getUpgradeResourceCost(2,nextLevel,window.qaim[1]);
            // Render HTML
            $('#next-metals-level').text(nextLevel);
            $('#energy-metals-upgrade').text(mRes.energy);
            $('#graphene-metals-upgrade').text(mRes.graphene);
            $('#metals-metals-upgrade').text(mRes.metals);
            
            // Finally Show the Modal
            window.id_modal_open = '#modal-metal-upgrade';
            $('#modal-metal-upgrade').modal('show');
        });

        $('#modal-metal-upgrade').on('hidden.bs.modal', function () {
            clean_modal();
        });

        function checkResourceUpgrade() {

            e = Math.min(...window.energyPanels);
            window.energyMinLevel = e;
            if (e<10)
                setUpgradeResourceBar(0, e+1);

            if (window.grapheneCollectorLevel < 10) {
                if (window.resourceUpgrading == 7 && window.resourceBlock != 0)
                    setUpgradeResourceBar(1, window.grapheneCollectorLevel+2);
                else
                    setUpgradeResourceBar(1, window.grapheneCollectorLevel+1);
            }

            if (window.metalsCollectorLevel < 10) {
                if (window.resourceUpgrading == 8 && window.resourceBlock != 0) 
                    setUpgradeResourceBar(2, window.metalsCollectorLevel+2);
                else
                    setUpgradeResourceBar(2, window.metalsCollectorLevel+1);
            }
            if (window.resourceUpgrading > 0 && window.resourceUpgrading <= 9 && window.resourceBlock != 0) {
                if (window.resourceUpgrading <= 6) {
                    setUpgradeResourceReady(0,2);
                    setUpgradeResourceReady(1,1);
                    setUpgradeResourceReady(2,1);
                } else {
                    if (window.resourceUpgrading == 7) {
                        setUpgradeResourceReady(1,2);
                        setUpgradeResourceReady(0,1);
                        setUpgradeResourceReady(2,1);
                    } else {
                        setUpgradeResourceReady(0,1);
                        setUpgradeResourceReady(1,1);
                        setUpgradeResourceReady(2,2);
                    }
                }
            } else {
                
                // Resource 0 is Energy
                if (e<10) {
                    eRes = window.cssgame.getUpgradeResourceCost(0,e+1,window.qaim[1]);
                    if ( eRes.energy <= window.energyStock && 
                        eRes.graphene <= window.grapheneStock && 
                        eRes.metals <= window.metalsStock && 
                        window.resourceBlock == 0)
                        setUpgradeResourceReady(0,0);
                    else
                        setUpgradeResourceReady(0,1);
                }
                else {
                    setUpgradeResourceReady(0,1);
                    //$('#energy-bars').hide();
                }

                // Resource 1 is Graphene
                if (window.grapheneCollectorLevel < 10) {

                    gRes = window.cssgame.getUpgradeResourceCost(1,window.grapheneCollectorLevel+1,window.qaim[1]);
                    if ( gRes.energy <= window.energyStock && 
                        gRes.graphene <= window.grapheneStock && 
                        gRes.metals <= window.metalsStock && 
                        window.resourceBlock == 0)
                        setUpgradeResourceReady(1,0);
                    else
                        setUpgradeResourceReady(1,1);
                } else {
                    setUpgradeResourceReady(1,1);
                    //$('#graphene-bars').hide();
                }

                // Resource 2 is Metals
                if (window.metalsCollectorLevel < 10) {
                    mRes = window.cssgame.getUpgradeResourceCost(2,window.metalsCollectorLevel+1,window.qaim[1]);
                    if ( mRes.energy <= window.energyStock && 
                        mRes.graphene <= window.grapheneStock && 
                        mRes.metals <= window.metalsStock && 
                        window.resourceBlock == 0)
                        setUpgradeResourceReady(2,0);
                    else
                        setUpgradeResourceReady(2,1);
                } else {
                    setUpgradeResourceReady(2,1);
                    //$('#metals-bar').hide();
                }
            }
        }    

        function setUpgradeResourceBar(resource,level) {

            res = window.cssgame.getUpgradeResourceCost(resource,level,window.qaim[1]);        
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
            if (level < 11) {
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

        function checkConverterRole() {
            if (window.role == 2) {
                // Falta checkear si el watch esta bien
                $('#converter-watch').show();
                $('#convert-energy').show();
                $('#convert-graphene').show();
                $('#convert-metal').show();
            }
            else {
                $('#set-resource-converter').hide();
            }
        }

        function setProduction() {
            $('#energy-production').text(window.energyProduction);
            $('#graphene-production').text(window.grapheneProduction);
            $('#metals-production').text(window.metalsProduction);
            $('#metals-collector-level').text(window.metalsCollectorLevel);
            $('#graphene-collector-level').text(window.grapheneCollectorLevel);
        }

        function setCountdown() {
            $('#countdown-upgrade-blocks').text(window.resourceBlock);
            $('#countdown-converter-blocks').text(window.converterBlock);
        }
        
        function setEventsCounter() {
            if (window.eventsCount > 0) {
                $('#events-alert').text(window.eventsCount);
            }
            else {
                $('#events-alert').text('');
            }
        }

        function setShip() {
            $('#ship-name').text(window.shipName);
            $('#position-x').text(window.position_x);
            $('#position-y').text(window.position_y);
        }

        function setUpgradeResourceReady(resource, show_type) {
            switch(resource) {
                case 0:
                    id_view = "#upgrade-energy";
                    id_ready = "#upgrade-energy-ready";
                    id_upgrading = "#upgrading-energy";
                    if (show_type == 0) {
                        // Upgrade Ready
                        $(id_view).hide();
                        $(id_ready).show();
                        $(id_upgrading).hide();
                        return;
                    }
                    if (show_type == 1) {
                        // No upgrade
                        $(id_view).show();
                        $(id_ready).hide();
                        $(id_upgrading).hide();
                        return;
                    }
                    if (show_type == 2) {
                        // Upgrading
                        $(id_view).hide();
                        $(id_ready).hide();
                        $(id_upgrading).show();
                        return;
                    }
                    break;
                case 1:
                    id_ready = "#upgrade-graphene-ready";
                    id_upgrading = "#upgrading-graphene";
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
                    id_ready = "#upgrade-metals-ready";
                    id_upgrading = "#upgrading-metals";
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

        function getUpgradeResourcesCost()
        {

            let energyCost = window.cssgame.getUpgradeResourceCost(0, window.energyMinLevel+1,window.qaim[1]);
            let grapheneCost;
            let metalsCost;
            if (window.resourceUpgrading == 7 && window.resourceBlock != 0)
                grapheneCost = window.cssgame.getUpgradeResourceCost(1, window.grapheneCollectorLevel+2,window.qaim[1]);
            else
                grapheneCost = window.cssgame.getUpgradeResourceCost(1, window.grapheneCollectorLevel+1,window.qaim[1]);
            
            if (window.resourceUpgrading == 8 && window.resourceBlock != 0)
                metalsCost = window.cssgame.getUpgradeResourceCost(2, window.metalsCollectorLevel+2,window.qaim[1]);  
            else
                metalsCost = window.cssgame.getUpgradeResourceCost(2, window.metalsCollectorLevel+1,window.qaim[1]);
            
            if (window.energyMinLevel < 10) {
                $('#energy-panels-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(energyCost.energy).toString());
                $('#energy-panels-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(energyCost.graphene).toString());
                $('#energy-panels-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(energyCost.metals).toString());
            }
            else {
                $('#energy-panels-energy-tooltip').attr('data-original-title', 'Energy panels max level reached');
                $('#energy-panels-graphene-tooltip').attr('data-original-title', 'Energy panel max level reached');
                $('#energy-panels-metals-tooltip').attr('data-original-title', 'Energy panel max level reached');
            }
            
            if (window.grapheneCollectorLevel < 10) {
                $('#graphene-collector-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(grapheneCost.energy).toString());
                $('#graphene-collector-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(grapheneCost.graphene).toString());
                $('#graphene-collector-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(grapheneCost.metals).toString());
            }
            else {
                $('#graphene-collector-energy-tooltip').attr('data-original-title', 'Graphene collector max level reached');
                $('#graphene-collector-graphene-tooltip').attr('data-original-title', 'Graphene collector max level reached');
                $('#graphene-collector-metals-tooltip').attr('data-original-title', 'Graphene collector max level reached');
            }
            
            if (window.metalsCollectorLevel < 10) {
                $('#metals-collector-energy-tooltip').attr('data-original-title', 'Energy required for next level: ' + parseInt(metalsCost.energy).toString());
                $('#metals-collector-graphene-tooltip').attr('data-original-title', 'Graphene required for next level: ' + parseInt(metalsCost.graphene).toString());
                $('#metals-collector-metals-tooltip').attr('data-original-title', 'Metals required for next level: ' + parseInt(metalsCost.metals).toString());
            }
            else {
                $('#metals-collector-energy-tooltip').attr('data-original-title', 'Metals collector max level reached');
                $('#metals-collector-graphene-tooltip').attr('data-original-title', 'Metals collector max level reached');
                $('#metals-collector-metals-tooltip').attr('data-original-title', 'Metals collector max level reached');
            }
        }
        

        // Once Time
        checkConverterRole();
        setProduction();
        setShip();
        setDamage();
        setGameStats();
        setEventsCounter();

        setResourcesStock();
        checkResourceUpgrade();
        setCountdown();
        getUpgradeResourcesCost();

        setInterval(function() {
            window.cssgame.viewShipVars(window.ship,function(e,r) {
                if(!e) {
                    ret = window.cssgame.viewShipVarsResult(r);
                    window.energyStock = ret.energyStock;
                    window.grapheneStock = ret.grapheneStock;
                    window.metalsStock = ret.metalStock;
                    if (window.resourceBlock != 0 && ret.countdownToUpgradeResources == 0) {
                        location.reload();
                    }
                    window.resourceBlock = ret.countdownToUpgradeResources;
                    window.converterBlock = ret.countdownToWopr;
                    window.damage = ret.damage;
                    setResourcesStock();
                    checkResourceUpgrade();
                    setCountdown();
                    setDamage()
                }
            });
        }, 5000);


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
        
        function init() {
            $('#resources').show();
            $('#stats').show();
            panelSlide("resources", 1000, "left", "+=50%"); 
            panelSlide("stats", 1000, "left", "-=50%");          
        }
        
        
        // call initializing routine
        init();
    });
});
