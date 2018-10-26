class Events {
    constructor(baseurl) {
        this.baseurl = baseurl;
    }

    count(gameId,shipId,callback) {
        let ep = '/api/events/' + gameId.toString() + '/' + shipId.toString() + '/unread/count';
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
        let ep = '/api/events/' + eventId.toString();
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
} 


class Orders {
    constructor(baseurl) {
        this.baseurl = baseurl;
    }

    add(gameId,shipId,order,hash,callback) {
        let ep = '/api/orders/add/';
        let xhr = new XMLHttpRequest();
        let doc = {};
        doc.gameId = gameId;
        doc.shipId = shipId
        doc.orderType = order;
        doc.txHash = hash;
        xhr.open('POST',this.baseurl + ep,true);
        xhr.withCredentials = true;
        xhr.send(JSON.stringify(doc));
        xhr.onreadystatechange = function() {
            if(this.readyState == XMLHttpRequest.DONE) {
                if (this.status == 201) 
                    callback(null,hash);
                else
                    callback(xhr.response,hash);
            }
        }
    }
}

class Backend {
    constructor(baseurl) {
        this.events = new Events(baseurl);
        this.orders = new Orders(baseurl);
    }
}