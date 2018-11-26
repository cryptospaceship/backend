class Fisics {
    constructor(net) {
        switch(net) {
            case 42:
                // Kovan
                this.val = this.kovan_val;
                break;
            case 77:
                // Poa
                this.val = this.poa_val;
                break;
            case 31:
                // Rsk
                this.val = this.rsk_testnet;
                break;
            default:
                throw "Wrong Network";
        }
    }
    
    ethereum_val(v) {
        return parseInt(v/3);
    }

    kovan_val(v) {
        return v;
    }

    poa_val(v) {
        return v;
    }

    rsk_testnet(v) {
        return parseInt(v/10);
    }

    rsk(v) {
        return parseInt(v/2);
    }
}


class CSSGame {

    constructor(provider,abi,address,network) {
        this.version = "1.5-AS";
		this.access = provider.eth.contract(abi);
        this.contract = this.access.at(address);
        this.w3 = provider;
        this.fisics = new Fisics(network);
    }

    getNetwork(callback) {
        let w3 = this.w3;
        w3.version.getNetwork(callback);
    }

    getBlockNumber(callback) {
        let w3 = this.w3;
        w3.eth.getBlockNumber(callback);
    }

    placeShip(ship,qaim1,qaim2,callback) {
        let w3 = this.w3;
        let contract = this.contract;
        contract.getGame(function(error,ret) {
            if (!error) {
                contract.placeShip(ship,qaim1,qaim2,{from:w3.eth.accounts[0],gasPrice:1000000000,value:ret[2].toNumber()},callback);
            }
        });
    }

    claimVictory(callback) {
        let w3 = this.w3;
        this.contract.claimVictory({from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    // Resources Functions
    upgradeEnergy(ship,panel,callback) {
        let w3 = this.w3;
        this.contract.upgradeResource(ship,0,panel,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    upgradeGraphene(ship,callback) {
        let w3 = this.w3;
        this.contract.upgradeResource(ship,1,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    upgradeMetals(ship,callback) {
        let w3 = this.w3;
        this.contract.upgradeResource(ship,2,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Buildings Functions
    upgradeWarehouse(ship,callback){
        let w3 = this.w3;
        this.contract.upgradeBuilding(ship,0,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    upgradeHangar(ship,callback){
        let w3 = this.w3;
        this.contract.upgradeBuilding(ship,1,0,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    upgradeWopr(ship,role,callback){
        let w3 = this.w3;
        this.contract.upgradeBuilding(ship,2,role,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Attack Functions
    attackPort(ship, port,callback) {
        let w3 = this.w3;
        this.contract.attackPort(ship,port,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }
    attackShip(ship, to, callback) {
        let w3 = this.w3;
        this.contract.attackShip(ship,to,true,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    raidShip(Ship, to, callback) {
        let w3 = this.w3;
        this.contract.attackShip(ship,to,false,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    fireCannon(ship,to,callback){
        let w3 = this.w3;
        this.contract.fireCannon(ship,to,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Send Resources
    sendResources(_from,_to,energy,graphene,metals,callback) {
        let w3 = this.w3;
        this.contract.sendResources(_from,_to,energy,graphene,metals,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Fleet Functions
    designFleet(_ship,_attack,_defense,_distance,_load,callback) {
        let w3 = this.w3;
        this.contract.designFleet(_ship,_attack,_defense,_distance,_load,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    buildFleet(_ship,size,callback) {
        let w3 = this.w3;
        this.contract.buildFleet(_ship,size,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    disassembleFleet(_ship,_size,callback) {
        let w3 = this.w3;
        this.contract.disassembleFleet(_ship,_size,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Movemment Functions
    moveTo(_ship, x, y, callback) {
        let w3 = this.w3;
        this.contract.moveTo(_ship,x,y,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    landTo(_ship, x, y, defend, callback) {
        let w3 = this.w3;
        this.contract.landTo(_ship,x,y,defend,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Mode
    changeMode(_ship, _mode, callback) {
        let w3 = this.w3;
        this.contract.changeMode(_ship,_mode,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }


    convertResource(_ship,_src,_dst,_n,callback) {
        let w3 = this.w3;
        this.contract.convertResource(_ship,_src,_dst,_n,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    setProductionResourcesConverter(_ship,_g,_m,callback) {
        let w3 = this.w3;
        this.contract.setProductionResourcesConverter(_ship,_g,_m,{from:w3.eth.accounts[0],gasPrice:1000000000},callback);
    }

    // Query Functions
    getInPosition(x,y,callback) {
        let w3 = this.w3;
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

    getGame(callback) {
        this.contract.getGame(callback);
    }

    getGameResult(result) {
        var ret = {};
        ret.gameLaunch = result[1].toNumber();
        ret.endBlock = result[3].toNumber();
        ret.reward = result[4].toNumber();
        ret.candidate = result[6];
        return ret;
    }

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
        ret.inPort = result[4];
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
        ret.damage = result[9].toNumber();
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
            range = parseInt(range/2);
        }
        return (range >= d);
    }

    static isShipInRange(from, to, mode) {
        let movemmentPerMode = [4,6,3,0]
        let d = this.getDistance(from,to);
        return (movemmentPerMode[mode] >= d);
    }

    static getRangeByMode(mode) {
        let movemmentPerMode = [4,6,3,0];
        return movemmentPerMode[mode];
    }

    static checkCannonRange(from, to, level) {
        let d = this.getDistance(from,to);
        return (level > 0 && (d == 1 || (d == 2 && level == 4)));
    }

    static getCannonDamage(from, to, level) {
        let d = this.getDistance(from,to);
        if (this.checkCannonRange(from,to,level)) {
            if (d == 2)
                return 10;
            else
                return 20;
        }
    }

    static energyToFire(energy) {
        return (energy >= 2000000)
    }

    static getFleetType(_attack, _defense, _distance, _load) {
        var fleetType = 0;
        var ftstr = ["Error", "Predator", "Keeper", "Interceptor", "Galleon", "Hybrid"];
        var _d = _distance * 6;
        var _l = _load/80;
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
        var points = _attack + _defense + (_distance * 6) + (_load/80);
        if (points <= 100 && points != 0) {
            ret.valid = true;
            ret.e = (20*_attack) + (20 * _defense) + (20*(_distance*6)) + (20*(_load/80));
            ret.g = (70*_defense) + (70*(_distance*6)) + (50*_attack) + (30*(_load/80));
            ret.m = (70*_attack) + (70*(_load/80)) + (50*_defense) + (30*(_distance*6));
        }
        else {
            ret.valid = false;
            ret.e = 0;
            ret.g = 0;
            ret.m = 0;
        }
        return ret;
    }

    getProductionByLevel(level) {
        let v = [0,1,2,3,4,7,10,14,20,28,40];
        return v[level];
    }

    getProductionToConverter(graphene, metal) {
        return (parseInt(graphene) + parseInt(metal));
    }

    getConvertionRate(n,converterLevel) {
        if (converterLevel == 2)
            return parseInt(n / 2);
        else
            return parseInt(n / 4);
    }


    getFleetCostBasic(_attack, _defense, _distance, _load) {
        let r = {};
        r.energy = this.fisics.val(20) * (_attack + _defense + (_distance*6) + (_load/this.fisics.val(80)));
        r.graphene = this.fisics.val(70) * (_defense + (_distance*6)) + (this.fisics.val(50)*_attack) + (this.fisics.val(30)*(_load/this.fisics.val(80)));
        r.metals = this.fisics.val(70) * (_attack + (_load/this.fisics.val(80))) + (this.fisics.val(50)*_defense) + (this.fisics.val(30)*(_distance*6));
        return r;
    }

    getFleetCost(_attack,_defense,_distance,_load,_qaim) {
        let r;
        r = this.getFleetCostBasic(_attack,_defense,_distance,_load);
        r.energy = r.energy - this.constructor._percent(r.energy,_qaim);
        r.graphene = r.graphene - this.constructor._percent(r.graphene,_qaim);
        r.metals = r.metals - this.constructor._percent(r.metals,_qaim);

        return r;    
    }

    getResourcesToReturn(level) {
        if (level == 0) {
            return 0;
        }
        return (level-1) * 10;
    }

    calcReturnResourcesFromFleet(level, _attack, _defense, _distance, _load, _size) {
        let r;
        r = this.getFleetCostBasic(_attack, _defense, _distance, _load);
        r.energy = 0;
        r.graphene = parseInt((r.graphene * _size) * this.getResourcesToReturn(level) / 100);
        r.metals = parseInt((r.metals * _size) * this.getResourcesToReturn(level) / 100);
        return r;
    }

    getWarehouseLoadByLevel(level)
    {
        var load = [10000, 50000, 150000, 1300000, 16000000];
        return this.fisics.val(load[level]);
    }

    static getPointsByHangarLevel(level)
    {
        let p = [0,60,70,85,100];
        return p[level];
    }


    static getWarehouseLoadByLevel(level, network)
    {
        let fisics = new Fisics(network);
        var load = [10000, 50000, 150000, 1300000, 16000000];
        return fisics.val(load[level]);
    }

    getUpgradeResourceCost(_type, _level, _qaim) {
        var _typeCost = [0,1200,2520,5292,12171,26168,56263,120965,260076,559164,1202204];
        var r = {};
        if (_type === "energy" || _type == 0) {
            r.energy = _typeCost[_level];
            r.graphene = _typeCost[_level]*2;
            r.metals = _typeCost[_level]*2;
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
        r.energy = this.fisics.val(r.energy);
        r.graphene = this.fisics.val(r.graphene);
        r.metals = this.fisics.val(r.metals);

        r.energy = parseInt(r.energy - this.constructor._percent(r.energy,_qaim));
        r.graphene = parseInt(r.graphene - this.constructor._percent(r.graphene,_qaim));
        r.metals = parseInt(r.metals - this.constructor._percent(r.metals,_qaim));

        return r;
    }

    getUpgradeBuildingCost(_type, _level, _qaim) {
        var buildingCost = [0,5292,26168,120965,559164];
        var r = {};
        r.energy = buildingCost[_level];
        r.graphene = buildingCost[_level];
        r.metals = buildingCost[_level];

        if (_type == 2) {
            r.energy = buildingCost[_level+2]*4;
            r.graphene = buildingCost[_level+2]*4;
            r.metals = buildingCost[_level+2]*4;
        }
        r.energy = this.fisics.val(r.energy);
        r.graphene = this.fisics.val(r.graphene);
        r.metals = this.fisics.val(r.metals);

        r.energy = parseInt(r.energy - this.constructor._percent(r.energy,_qaim));
        r.graphene = parseInt(r.graphene - this.constructor._percent(r.graphene,_qaim));
        r.metals = parseInt(r.metals - this.constructor._percent(r.metals,_qaim));

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

    static _percent(n, p)
    {
        return parseInt(p*n/100);
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