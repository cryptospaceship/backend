class Events {
    constructor(baseurl) {
        this.baseurl = baseurl;
    }

    count(gameId,callback) {
        let ep = '/api/event/count/' + gameId.toString() + '/' ;
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200) 
                    callback(null,JSON.parse(xhr.response));
                else
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }

    get(eventId, callback) {
        let ep = '/api/event/' + eventId.toString() + '/';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200) 
                    callback(null,JSON.parse(xhr.response));
                else
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }

    getsince(gameId, eventId, callback) {
        let ep = '/api/event/since/' + gameId.toString() + '/' + eventId.toString() + '/';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200){
                    callback(null,JSON.parse(xhr.response));
                }
                else 
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }
}

class Messages {
    constructor(baseurl) {
        this.baseurl = baseurl;
    } 
    
    send(data, callback) {
        let ep = '/api/message/new/';
        let xhr = new XMLHttpRequest();
        xhr.open("POST", this.baseurl + ep, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if(xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 201) {
                    callback(undefined, undefined);
                }
                else{
                    console.log(xhr.response);
                    callback(xhr.response, undefined);
                }
            }
        }
        xhr.send(JSON.stringify(data));
        
    }
    
    getsince(gameId, messageId, callback) {
        let ep = '/api/message/since/' + gameId.toString() + '/' + messageId.toString() + '/';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200){
                    callback(null,JSON.parse(xhr.response));
                }
                else 
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }

    get(messageId, callback) {
        let ep = '/api/message/get/' + messageId.toString();
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200){

                    callback(null,JSON.parse(xhr.response));
                }
                else 
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }
    
    count(gameId, callback) {
        let ep = '/api/message/count/' + gameId.toString()  + '/inbox/';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200){
                    callback(null,xhr.response);
                }
                else 
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }
    
}
    
class Backend {
    constructor(baseurl) {
        this.events = new Events(baseurl);
        this.messages = new Messages(baseurl);
        this.baseurl = baseurl;
    }

    shipingame(shipId,gameId, callback) {
        let ep = '/api/ship/ingame/' + shipId.toString() + '/' + gameId.toString() + '/';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 200){
                    callback(null,JSON.parse(xhr.response));
                }
                else 
                    callback(xhr.response,null);
            }   
        }
        xhr.open('GET', this.baseurl + ep, true);
        xhr.send();
    }

}