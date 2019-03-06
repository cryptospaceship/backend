
class CSSInit {
    constructor(config) {
        this.account = config.account;
        this.networks = config.networks;
        /*
         * Urls
         */
        this.signout = config.signout;
        this.install = config.install;
        this.unlock  = config.unlock;
        this.select_network = config.network;

    }

    checkMetamask(install, unlock) {
        
        if (typeof this.web3 === 'undefined') 
            window.location.href = install;
        if (!(this.web3.currentProvider.isMetaMask)) 
            window.location.href = install;
    
        if (this.web3.eth.accounts[0] == undefined)
            window.location.href = unlock;
        return this.web3.eth.accounts[0];
    }

    setAccountCheck(account, signout) {
        let w3 = this.web3;
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
        let w3 = this.web3;
        window.networkCheckInterval = setInterval(function() {
            w3.version.getNetwork(function(err,net) {
                if (!err) {
                    let ok = false;
                    for (let i = 0; i <= networks.length-1; i++ ) {
                        if (networks[i] == net)
                            ok = true;
                    }
                    if (!ok) 
                        window.location = url;
                    else {
                        if (typeof window.current_network == 'undefined')
                            window.current_network = net;
                        if (window.current_network != net)
                            window.location = '/ui/ships/';
                    }
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

    async init(callback) {

        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                // Request account access if needed
                await ethereum.enable();
                // Acccounts now exposed
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            window.web3 = new Web3(web3.currentProvider);
            // Acccounts always exposed
        }
        this.web3 = window.web3;

        this.checkMetamask(this.install,this.unlock);

        if (typeof this.account !== 'undefined' && this.account != '') 
            this.setAccountCheck(this.account,this.signout);

        this.setNetworkCheck(this.networks, this.select_network);
        
        if (typeof callback === "function") {
            // Call it, since we have confirmed it is callable
            callback();
        }
    }
}
