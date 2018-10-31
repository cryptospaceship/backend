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

class Backend {
    constructor(baseurl) {
        this.events = new Events(baseurl);
    }
}