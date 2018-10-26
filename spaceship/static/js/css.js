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

class CSSToken {
    constructor(provider,abi,address,web3) {
        this.access = provider.eth.contract(abi);
        this.contract = this.access.at(address);
        this.w3 = web3;
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

    getShipsByOwner(address,callback) {
        this.contract.getShipsByOwner(address,callback);
    }

    getShipsByOwnerResult(result) {
        let ret = [];
        for (let i = 0; i <= result.length -1; i++) {
            ret[i] = result[i].toNumber();
        }
        return ret;
    }
}

class CSSGame {

    constructor(provider,abi,address,web3) {
        this.version = "1.1.AS";

		this.access = provider.eth.contract(abi);
        this.contract = this.access.at(address);
        this.w3 = web3;
    }

    getNetwork(callback) {
        let w3 = this.w3;
        w3.version.getNetwork(callback);
    }

    getBlockNumber(callback) {
        let w3 = this.w3;
        w3.eth.getBlockNumber(callback);
    }

    placeShip(ship,callback) {
        let contract = this.contract;
        let w3 = this.w3;
        contract.getGame(function(error,ret) {
            if (!error) {
                contract.placeShip(ship,{from:w3.eth.accounts[0],gasPrice:1000000000,value:ret[3].toNumber()},callback);
            }
        });
    }

    claimVictory(callback) {
        this.contract.claimVictory({from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    // Resources Functions
    upgradeEnergy(ship,panel,callback) {
        this.contract.upgradeResource(ship,0,panel,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    upgradeGraphene(ship,callback) {
        this.contract.upgradeResource(ship,1,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    upgradeMetals(ship,callback) {
        this.contract.upgradeResource(ship,2,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Buildings Functions
    upgradeWarehouse(ship,callback){
        this.contract.upgradeBuilding(ship,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    upgradeHangar(ship,callback){
        this.contract.upgradeBuilding(ship,1,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    upgradeCannon(ship,callback){
        this.contract.upgradeBuilding(ship,2,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Attack Functions
    attackPort(ship, port,callback) {
        this.contract.attackPort(ship,port,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    attackShip(ship, to, callback) {
        this.contract.attackShip(ship,to,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    fireCannon(ship,to,callback){
        this.contract.fireCannon(ship,to,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Send Resources
    sendResources(_from,_to,energy,graphene,metals,callback) {
        this.contract.sendResources(_from,_to,energy,graphene,metals,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Fleet Functions
    designFleet(_ship,_attack,_defense,_distance,_load,callback) {
        this.contract.designFleet(_ship,_attack,_defense,_distance,_load,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    disassembleFleet(_ship,callback) {
        this.contract.disassembleFleet(_ship,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    buildFleet(_ship,size,callback) {
        this.contract.buildFleet(_ship,size,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    destroyFleet(_ship,callback) {
        this.contract.destroyFleet(_ship,size,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    } 

    // Movemment Functions
    moveTo(_ship, x, y, callback) {
        this.contract.moveTo(_ship,x,y,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    landTo(_ship, x, y, defend, callback) {
        this.contract.landTo(_ship,x,y,defend,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Mode
    changeMode(_ship, _mode, callback) {
        this.contract.changeMode(_ship,_mode,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Query Functions
    getInPosition(x,y,callback) {
        this.contract.getInPosition(x,y,callback);
    }
    getInPositionResult(result) {
        var ret = {};
        ret.id = result[0].toNumber();
        ret.graphene = result[1].toNumber();
        ret.metals = result[2].toNumber();
        return ret;
    }
    /*
        game.getInPosition(5,2,function(error, result) {
            if (!error) {
                ret = game.getInPositionResult(result);
            }
        });
    */
    getStrategicMap(x,y,callback) {
        this.contract.getStrategicMap(x,y,callback);
    }
    getStrategicMapResult(result) {
        var ret = {};
        var i;
        ret.x = result[49].toNumber();
        ret.y = result[50].toNumber();
        ret.center_x = ret.x + 3;
        ret.center_y = ret.y + 3;
        ret.map = []
        for (i=0; i<= 51-1; i++) {
            ret.map[i] = result[i].toNumber();
        }
        return ret;
    }
    /*
        game.getStrategicMap(5,2,function(error, result) {
            if (!error) {
                ret = game.getStrategicMapResult(result);
            }
        });
    */

    getPort(callback) {
        this.contract.getPort(callback);
    }

    getPortResult(result) {
        var ret = {};
        var i;
        ret.name = result[0];
        ret.owner = result[1];
        ret.defenders = [];
        for ( i = 0; i <= 4-1; i++ )
            ret.defenders[i] = result[2][i].toNumber();
        ret.defenderPower = result[3].toNumber();
        return ret;
    }

    getShipByOwner(owner, callback) {
        this.contract.getShipByOwner(owner, callback);
    }

    getShipByOwnerResult(result) {
        if (result[0]) 
            return result[1].toNumber();
        return -1;
    }

    // View
    viewFleet(ship, callback) {
        this.contract.viewFleet(ship,callback);
    }

    viewFleetResult(result) {
        var ret = {};
        ret.fleetType = result[0].toNumber();
        ret.energyCost = result[1].toNumber();
        ret.grapheneCost = result[2].toNumber();
        ret.metalCost = result[3].toNumber();
        ret.attack = result[4].toNumber();
        ret.defense = result[5].toNumber();
        ret.distance = result[6].toNumber();
        ret.load = result[7].toNumber();
        ret.size = result[8].toNumber();
        ret.inProduction = result[9].toNumber();
        ret.endProduction = result[10].toNumber();
        ret.blocksToEndProduction = result[11].toNumber();
        return ret;
    }
    /*
        game.viewFleet(5,function(error, result) {
            if (!error) {
                ret = game.viewFleetResult(result);
            }
        });
    */

    viewShip(ship,callback) {
        this.contract.viewShip(ship,callback);
    }

    viewShipResult(result) {
        var ret = {};
        ret.name = result[0];
        ret.x = result[1].toNumber();
        ret.y = result[2].toNumber();
        ret.mode = result[3].toNumber();
        ret.damage = result[4].toNumber();
        return ret;
    }

    viewShipVars(ship, callback) {
        this.contract.viewShipVars(ship,callback);
    }    

    viewShipVarsResult(result) {
        var ret = {};
        ret.energyStock = result[0].toNumber();
        ret.grapheneStock = result[1].toNumber();
        ret.metalStock = result[2].toNumber();
        ret.countdownToUpgradeResources = result[3].toNumber();
        ret.countdownToUpgradeBuildings = result[4].toNumber();
        ret.countdownToMove = result[5].toNumber();
        ret.countdownToFleet = result[6].toNumber();
        ret.countdownToMode = result[7].toNumber();
        ret.countdownToFireCannon = result[8].toNumber();
        return ret;
    }

    
    static getDistanceX(a_x,a_y,b_x,b_y) {
        return this.getDistance([a_x,a_y],[b_x,b_y]);
    }

    static getDistance(a, b) {
        var d = 0;
        
        if (a[0] < b[0]) d = b[0] - a[0]; 
        else d = a[0] - b[0];

        if (a[1] < b[1]) d += b[1] - a[1]; 
        else d += a[1] - b[1];
            
        return d;
    }


    static getFleetRange(range, mode) {
        if (mode == 2) {
            range = range + parseInt(range/2);
        }
        return range;
    }

    static isFleetinRange(from, to, range, mode) {
        let d = this.getDistance(from,to);
        if (mode == 2) {
            range = range + parseInt(range/2);
        }
        if (mode == 3) {
            range = 0;
        }
        return (range >= d);
    }

    static isShipInRange(from, to, mode) {
        let movemmentPerMode = [4,6,3,0];
        let d = this.getDistance(from,to);
        return (movemmentPerMode[mode] >= d);
    }

    static getRangeByMode(mode) {
        let movemmentPerMode = [4,6,3,0];
        return movemmentPerMode[mode];
    }

    static getFleetType(_attack, _defense, _distance, _load)
    {
        var fleetType = 0;
        var ftstr = ["Error", "Predator", "Keeper", "Interceptor", "Galleon", "Hybrid"];
        var _d = _distance * 7;
        var _l = _load/40;
        if ( _attack > _defense && _attack > _d && _attack > _l ) {
            fleetType = 1;
        }
        else {
            if (_defense > _attack && _defense > _d && _defense > _l) {
                fleetType = 2;
            }
            else {
                if ( _d > _attack && _d > _defense && _d > _l) {
                    fleetType = 3;
                }
                else {
                    if (_l > _attack && _l > _defense && _l > _d) {
                        fleetType = 4;
                    }
                    else {
                        fleetType = 5;
                    }
                }
            }
        }
        return ftstr[fleetType];
    }

    static getFleetTypeName(type)
    {
        var ftstr = ["Error", "Predator", "Keeper", "Interceptor", "Galleon", "Hybrid"]; 
        return ftstr[type];   
    }

    static getFleetCost(_attack, _defense, _distance, _load) {
        var ret = {};
        var points = _attack + _defense + (_distance * 7) + (_load/40);
        if (points <= 100 && points != 0) {
            ret.valid = true;
            ret.e = (20*_attack) + (20 * _defense) + (20*(_distance*7)) + (20*(_load/40));
            ret.g = (70*_defense) + (70*(_distance*7)) + (50*_attack) + (30*(_load/40));
            ret.m = (70*_attack) + (70*(_load/40)) + (50*_defense) + (30*(_distance*7));
        }
        else {
            ret.valid = false;
            ret.e = 0;
            ret.g = 0;
            ret.m = 0;
        }
        return ret;
    }

    static getWarehouseLoadByLevel(level)
    {
        var load = [10000, 50000, 150000, 1300000, 16000000];
        return load[level];
    }


    static getResourceUpgradeCost(_type, _level) {
        var _typeCost = [0,1200,2520,5292,11113,23338,49009,102919,216131,453874,953136];
        var r = {};
        if (_type === "energy" || _type == 0) {
            r.energy = _typeCost[_level] / 2;
            r.graphene = _typeCost[_level];
            r.metals = _typeCost[_level];
        }
        else if (_type === "graphene" || _type == 1) {
            r.energy = _typeCost[_level];
            r.graphene = _typeCost[_level] / 2;
            r.metals = _typeCost[_level];
        }
        else if (_type === "metals" || _type == 2) {
            r.energy = _typeCost[_level];
            r.graphene = _typeCost[_level];
            r.metals = _typeCost[_level] / 2;
        }
        return r;
    }

    static getUpgradeBuildingCost(_type, _level) {
        var buildingCost = [0,5292,23338,102910,453874];
        var r = {};
        r.energy = buildingCost[_level];
        r.graphene = buildingCost[_level];
        r.metals = buildingCost[_level];

        if (_type == 2 || _type === 'cannon') {
            r.energy = r.energy * 3 ;
            r.graphene = r.graphene * 3;
            r.metals = r.metals * 3;
        }

        return r;
    }

    static getModeName(mode) {
        let ret;
        switch(mode) {
            case 0:
                ret = "Default";
                break;
            case 1:
                ret = "Movemment";
                break;
            case 2:
                ret = "Attack";
                break;
            case 3:
                ret = "Defense";
                break;
        }
        return ret;
    }

    static isPort(id) {
        if (id < 1000) return true;
        return false;
    }
    static isShip(id) {
        if (id >= 1000) return true;
        return false;
    }

}