class CSSToken {

    constructor(provider,abi,address) {
        this.access = provider.eth.contract(abi);
        this.contract = this.access.at(address);
        this.w3 = provider;
    }

    createShip(name,color,callback) {
        let contract = this.contract;
        let w3 = this.w3;
        contract.getCreationShipPrice(function(error,price) {
            if (!error) {
                contract.createShip(name,color,{from:w3.eth.accounts[0],gasPrice:1000000000,value:price},callback);
            }
        });
    }

    exitGame(ship,callback) {
        this.contract.exitGame(ship,{from:this.w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    getShipsByOwner(address,callback) {
        this.contract.getShipsByOwner(address,callback);
    }

    setQAIM_wrap(ship, qaim_0, qaim_1, qaim_2, qaim_3, qaim_4, qaim_5, callback) {
        let qaim = [];
        qaim[0] = qaim_0;
        qaim[1] = qaim_1;
        qaim[2] = qaim_2;
        qaim[3] = qaim_3;
        qaim[4] = qaim_4;
        qaim[5] = qaim_5;
        
        for (let i = 6; i <= 32-1; i++) {
            qaim[i] = 0;
        }
        this.contract.setQAIM(ship,qaim,{from:this.w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    setQAIM(ship,qaim,callback) {
        this.contract.setQAIM(ship,qaim,{from:this.w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    getShipQAIM(ship,callback) {
        this.contract.getShipQAIM(ship,{from:this.w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    getShipQAIMResult(result) {
        let ret = [];
        for (let i = 0; i <= result.length -1; i++) {
            ret[i] = result[i].toNumber();
        }
        return ret;
    }

    getShipsByOwnerResult(result) {
        let ret = [];
        for (let i = 0; i <= result.length -1; i++) {
            ret[i] = result[i].toNumber();
        }
        return ret;
    }

    static formatPoints(p) {
        if (p < 1000) {
            if (p < 10) 
                return '00' + p.toString();
            if (p < 100)
                return '0' + p.toString();
            return p.toString();
        }
    }

    static colorToNumber(color) {
        return parseInt(color.replace('#',''),16);
    }

    static numberToColor(number) {
        let n = number.toString(16);
        let s = 6 - n.length;
        while ( s > 0 ) {
            n = '0' + n;
            s--;
        }
        return '#' + n;
    }

}