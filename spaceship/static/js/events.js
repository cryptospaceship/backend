$(document).ready(function(){
    window.backend = new Backend(window.baseUrl);

    function openShipBattleModal(data){
        $('#ship-battle-attacker').text(data.from + ' attacks');
        $('#ship-battle-attacker-fleet').text(data.meta._attacker_size);
        $('#ship-battle-attacker-casualties').text(data.meta._attacker_size - data.meta._attacker_left);
        $('#ship-battle-energy').text(data.meta._e);
        $('#ship-battle-graphene').text(data.meta._g);
        $('#ship-battle-metals').text(data.meta._m);
        $('#ship-battle-defender').text(data.to + ' defends');
        $('#ship-battle-defender-fleet').text(data.meta._defender_size);
        $('#ship-battle-defender-casualties').text(data.meta._defender_size - data.meta._defender_left);
        
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#ship-battle"});
        $('body').addClass('blur');
    }
    
    function openShipSentResourcesModal(data){
        $('#sent-resources-sender').text(data.from);
        $('#sent-resources-receiver').text(data.to);
        $('#sent-resources-energy').text(data.meta._e);
        $('#sent-resources-graphene').text(data.meta._g);
        $('#sent-resources-metals').text(data.meta._m);
        
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#sent-resources"});
        $('body').addClass('blur');
    }
    
    function openCannonFiredAccuracyModal(data){
        let target = {
            1: 'Solar Panel 1',
            2: 'Solar Panel 2',
            3: 'Solar Panel 3',
            4: 'Solar Panel 4',
            5: 'Solar Panel 5',
            6: 'Solar Panel 6',
            7: 'Graphene Collector',
            8: 'Metal Collector',
            9: 'Warehouse',
            10: 'Hangar',
            11: 'W.O.P.R.'            
        }
        
        let level = data.meta._level - data.meta._damage_level
        $('#cannon-fired-attacker').text(data.from);
        $('#cannon-fired-defender').text(data.to);
        $('#cannon-fired-target').text(target[data.meta._target]);
        $('#cannon-fired-damage').text(level.toString() + ' levels');
        $('#cannon-fired-information').text('-');
        
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#cannon-fired"});
        $('body').addClass('blur');
    }
    
    function openCannonFiredModal(data){        
        $('#cannon-fired-attacker').text(data.from);
        $('#cannon-fired-defender').text(data.to);
        $('#cannon-fired-target').text('Ship');
        $('#cannon-fired-damage').text(data.meta._damage + '%');
        if (data.meta._destroyed)
            $('#cannon-fired-information').text('The enemy has been destroyed');
        else
            $('#cannon-fired-information').text('-');
        
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#cannon-fired"});
        $('body').addClass('blur');
    }
    
    
    function openPortBattleModal(data){
        console.log(data);
        let defenders = (data.meta._to.filter((x) => { return x > 0; })).length;
        if (data.meta._attacker_left > 0)
            $('#port-battle-attacker').text(data.from + " Conquest Port");
        else
            $('#port-battle-attacker').text(data.from + " Lose the Battle");
        
        $('#port-battle-attacker-fleet').text(data.meta._attacker_size);
        $('#port-battle-attacker-casualties').text(data.meta._attacker_size - data.meta._attacker_left);
        
        if (data.meta._defenders_size[0] > 0)
            $('#port-battle-natives-casualties').text(data.meta._defenders_size[0] - data.meta._defenders_left[0]);
        else
            $('#port-battle-table-0').hide();
        
        let n = 1;
        for (let i=1; i < 5; i++) {
            if (data.meta._to[i-1] != 0) {
                let shipName = data.to[data.meta._to[i-1]];
                let id = '#port-battle-defender-' + n.toString();
                $(id).text(shipName);
                $(id + '-' + 'fleet').text(data.meta._defenders_size[i])
                $(id + '-' + 'casualties').text(data.meta._defenders_size[i] - data.meta._defenders_left[i])
                n++;
            }
        }
        console.log('value ' + n);
        for (let i=n; i < 5; i++) {
            $('#port-battle-table-' + i.toString()).hide();
        }
        
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#port-battle"});
        $('body').addClass('blur');
    }
    
    function closePortBattleModal() {
        $('#port-battle-table-1').show();
        $('#port-battle-table-2').show();
        $('#port-battle-table-3').show();
        $('#port-battle-table-4').show();
        $.colorbox.close();
    }
    
    
    function markAsViewed(ei){
        let eventId = $(ei).attr('event-id');
        $(ei).attr("style", "cursor: pointer;")
        //$('#message-icon-' + msgId.toString()).text("drafts ");        
    }
    
    function openEventModal(ei){
        window.backend.events.get($(ei).attr('event-id'), function(e,r) {
            if (!e) {
                console.log(r);
                if (r.event_type == 'AttackShipEvent')
                    openShipBattleModal(r);
                else if (r.event_type == 'SentResourcesEvent') 
                    openShipSentResourcesModal(r);
                else if (r.event_type == 'FireCannonEvent')
                    openCannonFiredModal(r);
                else if (r.event_type == 'FireCannonEventAccuracy')
                    openCannonFiredAccuracyModal(r);
                else if (r.event_type == 'AttackPortEvent')
                     openPortBattleModal(r);
                markAsViewed(ei);
            }
        });
    }

    $('[id="event"]').click(function() {         
        openEventModal(this);
    });
    
    $('#port-battle-close').on('click', function() {
        closePortBattleModal();
    });
    
    $(document).keydown(function(e){
        if (e.keyCode == 27) {
           closePortBattleModal();
        }
    });
    
});