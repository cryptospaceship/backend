
class CSSInit {
    constructor(config,w3) {
        this.account = config.account;
        console.log(config.account);
        this.networks = config.networks;
        /*
         * Urls
         */
        this.signout = config.signout;
        this.install = config.install;
        this.unlock  = config.unlock;
        this.network = config.network;
        this.w3    = w3;
    }

    checkMetamask(install, unlock) {
        
        if (typeof this.w3 === 'undefined') 
            window.location.href = install;
        if (!(this.w3.currentProvider.isMetaMask)) 
            window.location.href = install;
    
        if (this.w3.eth.accounts[0] == undefined)
            window.location.href = unlock;
        return this.w3.eth.accounts[0];
    }

    setAccountCheck(account, signout) {
        let w3 = this.w3;
        window.accountCheckInterval = setInterval(function() {
            if (typeof account !== 'undefined' && typeof signout !== 'undefined') {
                if (account != w3.eth.accounts[0]) {
                    clearInterval(window.accountCheckInterval);
                    window.location.href = signout;
                }
            }
        },100);
    }

    setNetworkCheck(networks,url) {
        let w3 = this.w3;
        window.networkCheckInterval = setInterval(function() {
            w3.version.getNetwork(function(err,net) {
                if (!err) {
                    let ok = false;
                    for (let i = 0; i <= networks.length-1; i++ )
                        if (networks[i] == net)
                            ok = true;
                    if (!ok) 
                        window.location = url;
                }
            });
        },2000);
    } 

    static getJSON(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET',url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
            if (xhr.status === 200) {
                callback(null,xhr.response);
            }
            else {
                callback(xhr.response,null);
            }
        };
        xhr.send();
    };

    init(callback) {
        this.checkMetamask(this.install,this.unlock);

        if (typeof this.account !== 'undefined' && this.account != '') 
            this.setAccountCheck(this.account,this.signout);

        this.setNetworkCheck(this.networks, this.network);
        
        if (typeof callback === "function") {
            // Call it, since we have confirmed it is callable
            callback();
        }
    }
}
