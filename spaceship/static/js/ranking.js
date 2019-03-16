$(document).ready(function(){
    window.backend = new Backend(window.baseUrl);

    function openStats(gas, tx, ok, error) {
        $('#gas').text(gas.toString());
        $('#transctions').text(tx.toString());
        $('#ok').text(ok.toString());
        $('#error').text(error.toString());
        $('body').addClass('blur');
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: true, href:"#stats"});
    }

    $('#open-stats').on('click',()=>{
        window.backend.getGas(17,(e,r)=>{
            openStats(r.gas,r.transactions,r.successful,r.error);
        });
    });

});