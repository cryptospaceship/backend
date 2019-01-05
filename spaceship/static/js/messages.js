$(document).ready(function(){
    console.log(window.baseUrl)
    window.backend = new Backend(window.baseUrl);
    
    function renderMessage(msg_id, from, subject, date, read) {
        // Primero crea el Date y le agrega el texto
        let date_div = document.createElement('div');
        let subject_div = document.createElement('div');
        let icons = document.createElement('i');
        let span = document.createElement('span');
        let from_div = document.createElement('div');
        let a = document.createElement('a');
    
        a.setAttribute("class", "message-content row-body");
        a.setAttribute("id", "message-inbox");
        a.setAttribute("msg-id", msg_id);
    
        from_div.setAttribute("class", "from-to row-table");
    
        icons.setAttribute("class", "material-icons");
        icons.setAttribute("style", "vertical-align: middle; display: inline; font-size: 20px");
        
        //console.log(read);
        if (read == false) {
            a.setAttribute("style", "background-color: #ffffff30; font-weight: 800; cursor: pointer;");
            span.setAttribute("id", "message-icon-80");
            span.innerText = "mail";
        } else {
            a.setAttribute("style", "cursor: pointer;");
            span.setAttribute("id", "message-icon-66");
            span.innerHTML = "drafts";
        }

        from_div.appendChild(icons);
        from_div.appendChild(document.createTextNode(" " + from));
    
        icons.appendChild(span);
        date_div.setAttribute("class", "date row-table");
        date_div.innerText = date;
        subject_div.setAttribute("class", "subject row-table");
        subject_div.innerText = subject;
    
        a.appendChild(from_div);
        a.appendChild(subject_div);
        a.appendChild(date_div);
        return a;
    }

    function renderPaginator(pages) {
        let li = document.createElement('li');
        let a  = document.createElement('a');
        
        a.setAttribute("href", "?page=" + pages);
        
        a.appendChild(document.createTextNode(pages))
        li.appendChild(a);
        
        $(li).insertAfter('#page-number-' + (pages - 1));
        $('#next-page-arrow').attr('class', 'arrow-next');
        $('#next-page-arrow').attr('href', '?page=2');
        $('#total-pages').text("Page 1 of " + pages)
        
        window.lastPage = pages;
    }
    

    function openMessageModal(msg){
        window.backend.messages.get($(msg).attr('msg-id'), function(e,r) {
            if (!e) {
                $('#message-from').text(r.from);
                $('#message-subject').text(r.subject);
                $('#message-text').text(r.message);
                $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: false, href:"#message-content" });
                $('body').addClass('blur');
                markAsRead(msg);
            }
        });
    }
    
    function markAsRead(msg){
        let msgId = $(msg).attr('msg-id');
        if (window.messageType == "inbox") {
            $(msg).attr("style", "cursor: pointer;")
            $('#message-icon-' + msgId.toString()).text("drafts ");
        }
    }
    
    function messageIsValid() {
        let subject = document.getElementById("subject").value;
        let message = document.getElementById("message").value;
        if (( typeof window.shipIdTo !== 'undefined') && (subject != '') && (message != ''))        
            return true;
        else
            return false;    
    }

    function clearNewMessageModal() {
        window.shipIdTo = undefined
        document.getElementById("to").value = "";
        document.getElementById("subject").value = "";
        document.getElementById("message").value = "";
    }

    
    function sendMessage(){
        let data = {
            "to": window.shipIdTo,
            "subject": document.getElementById("subject").value,
            "message": document.getElementById("message").value,
            "game_id": window.gameId,
        }
        console.log(data);
        window.backend.messages.send(data, function(e,r) {
            if (!e) {
                clearNewMessageModal();
                $.colorbox.close();
            }
            else
                console.log("e: " + e);
        });    
    }
    
    function createMessage(){
        $('body').attr('class', 'blur');
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: false, href:"#new-message", top: "50px" });
    }
    
    function replyMessage(){
        $('body').addClass('blur');
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: false, href:"#new-message", top: "50px" });
        $('#to').change();
        $('#to').prop('readonly', true);
        $('#subject').prop('readonly', true);
    }
    
    // Automcomplete para el envio de mensajes
    $('#to').autocomplete({
        lookup: window.shipList,
        lookupLimit: 10,
        autoSelectFirst: true,
        onSelect: function (suggestion) {
           window.shipIdTo = suggestion.data;
           console.log(window.shipIdTo);
        },
        onInvalidateSelection: function () {
            window.shipIdTo = undefined;
            console.log(window.shipIdTo);
        },
        formatResult: function (suggestion) {
            return '<div>' + suggestion.value + '</div>';
        }
    });
    
    
    $('[id="message-inbox"]').click(function() {         
        openMessageModal(this);
    });
    
    $('#new-message-button').on('click', function() {
        createMessage();
    });
    
    $('#reply-message-button').on('click', function() {
        document.getElementById("to").value = $('#message-from').text();
        document.getElementById("subject").value = "RE: " + $('#message-subject').text();
        replyMessage();
    });
    
    $('#send-message-button').on('click', function() {
        if (typeof window.shipIdTo === 'undefined')
            document.getElementById("to").value = "";
        console.log("send")
        if (messageIsValid()) {
            console.log("valid");
            sendMessage();
        }
    });
       
    $('#new-message-cancel-button').on('click', function() {
        clearNewMessageModal()
        $.colorbox.close();
    });
    
    if (typeof window.toShip !== 'undefined') {
        document.getElementById("to").value = window.toShip;
        $('body').addClass('blur');
        $.colorbox({ inline: true, closeButton: false, arrowKey: false, overlayClose: false, href:"#new-message", top: "50px" });
        $('#to').change();
        $('#to').prop('readonly', true);
    }
    
    if (typeof window.inbox != 'undefined' && window.inbox == true && window.actualPage == 1) {
        window.rm = setInterval(()=>{
            let last;
            if (typeof window.lastMessage == 'undefined')
                last = 0;
            else
                last = window.lastMessage;
                //last = 68;

            window.backend.messages.getsince(window.gameId,last,(e,m)=>{
                if (e == null) 
                    if (m.length > 0) {
                        window.totalMessages = window.totalMessages + m.length;
                        for (i = m.length -1; i >= 0; i-- ) {
                            msg = renderMessage(m[i].id,m[i].from,m[i].subject,m[i].date, m[i].read);
                            $('#table-body').prepend(msg);
                        }
                        let elements = $('[id="message-inbox"]');
                        if ( elements.length > 10 ) {
                            for (i = 10; i <= elements.length-1; i++) 
                                elements[i].remove();
                            pages = parseInt((window.totalMessages + m.length) / 10) + 1;
                            console.log(pages + " of " + window.lastPage);
                            if (pages > window.lastPage)
                                renderPaginator(pages);                            
                        }
                        window.lastMessage = m[0].id;
                        $('[id="message-inbox"]').off();
                        $('[id="message-inbox"]').click(function() {         
                            openMessageModal(this);
                        });
                    }
            });
        },5000);
    }
});