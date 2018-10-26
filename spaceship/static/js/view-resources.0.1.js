var DEBUG = true;
	
/**
 * Esto esta hardcodeado aca pero deberia estar en la consulta al contrato
 */

var ResourcesLevels = {};

function getResourceUpgradeCostByLevel(resource, level)
{
	var resourceCost = [0,1200,2520,5292,11113,23338,49009,102919,216131,453874,953136];

	if (resource === "energy")
	{
		r = {}
		r.energy = resourceCost[level] / 2;
		r.graphene = resourceCost[level];
		r.metals = resourceCost[level];
		return r;
	}
	else if (resource === "graphene")
	{
		r = {}
		r.energy = resourceCost[level];
		r.graphene = resourceCost[level] / 2;
		r.metals = resourceCost[level];
		return r;
	}
	else if (resource === "metals") 
	{
		r = {}
		r.energy = resourceCost[level];
		r.graphene = resourceCost[level];
		r.metals = resourceCost[level] / 2;
		return r;
	}
}

function getResourceUpgradeCost(resource)
{
	if (resource === "energy")
	{
		//level = document.getElementById("energy-average-level").innerText;
		level = ResourcesLevels.energyMin;
		return getResourceUpgradeCostByLevel(resource,parseInt(level)+1);
	}
	else if (resource === "graphene")
	{
		//level = document.getElementById("graphene-collector-level").innerText;
		level = ResourcesLevels.graphene;
		return getResourceUpgradeCostByLevel(resource,parseInt(level)+1);
	}
	else if (resource === "metals")
	{
		//level = document.getElementById("metals-collector-level").innerText;
		level = ResourcesLevels.metals;
		return getResourceUpgradeCostByLevel(resource,parseInt(level)+1);
	}
}

function renderResourcesLevel(energy,graphene,metals)
{
	average = 0;
	min     = 10;
	for (i = 0; i <= energy.length-1; i++ ) {
		average = average + energy[i].toNumber();
		if (energy[i].toNumber() < min)
		{
			min = energy[i].toNumber();
		}
	}
	averageEnergy = parseInt(average/energy.length);
	ResourcesLevels.energyAverage = averageEnergy;
	ResourcesLevels.energyMin = min;
	ResourcesLevels.graphene = graphene;
	ResourcesLevels.metals = metals;
	document.getElementById("energy-average-level").innerText = averageEnergy.toString();
	document.getElementById("graphene-collector-level").innerText = graphene.toString();
	document.getElementById("metals-collector-level").innerText = metals.toString();
}

function renderResourcesProduction(energy,graphene,metals)
{
	document.getElementById("energy-production").innerText = energy.toString();
	document.getElementById("graphene-production").innerText = graphene.toString();
	document.getElementById("metals-production").innerText = metals.toString();
}

function renderStock(data) {
	try {
		if (data.length != 3) throw "Invalid argument length in renderStock()";
		document.getElementById("energy-stock").innerHTML   = data[0].toNumber();	
		document.getElementById("graphene-stock").innerHTML = data[1].toNumber();
		document.getElementById("metals-stock").innerHTML    = data[2].toNumber();
	}
	catch(err) {
		if (DEBUG) window.alert(err);
		else console.log(err);
	}
}

function parseResult(result) {
	try {
		if (result.length != 3) throw "Invalid argument length in renderStock()";
		r = {}
		r.energy = result[0].toNumber();
		r.graphene = result[1].toNumber();
		r.metals = result[2].toNumber();
		return r;
	}
	catch(err) {
		if (DEBUG) window.alert(err);
		else console.log(err);
	}
}


function renderCountDownUpgradeBlocks(block) {
	try {
		document.getElementById("countdown-upgrade-blocks").innerHTML = block;
	}
	catch(err) {
		if (DEBUG) window.alert(err);
		else console.log(err);
	}
}

function showUpgradeResource(resource) 
{
	if (resource === "graphene") {
		document.getElementById("upgrade-graphene").style.display = "none";
		document.getElementById("upgrade-graphene-ready").style.display = "block";
	}
	else if (resource === "metals") {
		document.getElementById("upgrade-metals").style.display = "none";
		document.getElementById("upgrade-metals-ready").style.display = "block";
	}
	else if (resource === "energy") {
		document.getElementById("upgrade-energy").style.display = "none";
		document.getElementById("upgrade-energy-ready").style.display = "block";
	}
}
   
function hideUpgradeResource(resource)
{
	if (resource === "graphene") {
		document.getElementById("upgrade-graphene-ready").style.display = "none";
		document.getElementById("upgrade-graphene").style.display = "block";
	}
	else if (resource === "metals") {
		document.getElementById("upgrade-metals-ready").style.display = "none";
		document.getElementById("upgrade-metals").style.display = "block";
	}
	else if (resource === "energy") {
		document.getElementById("upgrade-energy-ready").style.display = "none";
		document.getElementById("upgrade-energy").style.display = "block";
	}
}

function calcFillBar(cost, stock) {
	e = stock.energy * 100 / cost.energy;
	g = stock.graphene * 100 / cost.graphene;
	m = stock.metals * 100 / cost.metals;
	if ( e > 100 ) e = 100;
	if ( g > 100 ) g = 100;
	if ( m > 100 ) m = 100; 
	r = {};
	if ( e == 100 && g == 100 && m == 100 )
		r.full = true;
	else
		r.full = false;
	r.e = parseInt(e).toString() + '%';
	r.g = parseInt(g).toString() + '%';
	r.m = parseInt(m).toString() + '%';
	return r;
}

function fillBar (resource, cost, stock) {
	bar = calcFillBar(cost, stock);
	if ( resource === "graphene" ) {
		document.getElementById("bar-energy2").style.width = bar.e;
		document.getElementById("bar-graphene2").style.width = bar.g;
		document.getElementById("bar-metals2").style.width = bar.m;
		document.getElementById("amount-energy2").innerHTML = bar.e;
		document.getElementById("amount-graphene2").innerHTML = bar.g;
		document.getElementById("amount-metals2").innerHTML = bar.m;
		return bar.full;
	}
	else if (resource === "metals") {
		document.getElementById("bar-energy3").style.width = bar.e;
		document.getElementById("bar-graphene3").style.width = bar.g;
		document.getElementById("bar-metals3").style.width = bar.m;
		document.getElementById("amount-energy3").innerHTML = bar.e;
		document.getElementById("amount-graphene3").innerHTML = bar.g;
		document.getElementById("amount-metals3").innerHTML = bar.m;
		return bar.full;
	}
	else if (resource === "energy") {
		document.getElementById("bar-energy1").style.width = bar.e;
		document.getElementById("bar-graphene1").style.width = bar.g;
		document.getElementById("bar-metals1").style.width = bar.m;
		document.getElementById("amount-energy1").innerHTML = bar.e;
		document.getElementById("amount-graphene1").innerHTML = bar.g;
		document.getElementById("amount-metals1").innerHTML = bar.m;
		return bar.full;
	}
}


window.addEventListener('load', function() {
	if (typeof web3 === 'undefined') {
		window.alert("Please Install Metamask");
		throw "Metamask";
	}

	if (web3.currentProvider.isMetaMask !== true) {
		window.alert("Please install MetaMask");
		throw "Metamask";
	}

	if (typeof gameNetwork === 'undefined') {
		if (DEBUG) window.alert("Internal error rendering gameNetwork");
		throw "gameNetwork";
	}

	if (typeof contractAbi === 'undefined' || typeof contractAddress === 'undefined') {
		if (DEBUG) window.alert("Internal error rendering contract data");
		throw "contract data";
	}

	web3.version.getNetwork(function(error,currentNetwork){
		if (error) {
			if (DEBUG) window.alert(error);
			throw error;
		}
		if (currentNetwork !== gameNetwork) {
			window.alert("Configure the correct Network: " + gameNetwork.toString());
			throw "Incorrect network";
		}

		w3 = new Web3(web3.currentProvider);
		contractAccess = w3.eth.contract(contractAbi);
		SpaceShip = contractAccess.at(contractAddress);

		function updateResourcesInStock(shipId) {
			SpaceShip.viewResourcesInStock(shipId, function(error,result) {
				if (!error) {
					renderStock(result);
					blocksToUpgrade = document.getElementById("countdown-upgrade-blocks").innerText;
					// Falta Energia
					canUpgradeGraphene = fillBar("graphene",getResourceUpgradeCost("graphene"),parseResult(result));
					canUpgradeMetals = fillBar("metals",getResourceUpgradeCost("metals"),parseResult(result));
					canUpgradeEnergy = fillBar("energy",getResourceUpgradeCost("energy"),parseResult(result));

					if (parseInt(blocksToUpgrade) != 0) {
						// Falta ocultar energia
						hideUpgradeResource("graphene");
						hideUpgradeResource("metals");
					}
					else {
						// Falta preguntar por energia
						if (canUpgradeGraphene) {
							showUpgradeResource("graphene");
						}
						if (canUpgradeMetals){
							showUpgradeResource("metals");
						}
					}
				}
				else {
					if (DEBUG) window.alert(error);
					else console.log(error);
				}
			});
		}

		function upgradeResource(ship,type,index) {
			SpaceShip.upgradeResource(ship,type,index,{from:web3.eth.accounts[0]},function(error, txHash) {
				if (!error) {
					setInterval(function() {
						web3.eth.getTransactionReceipt(txHash, function(err,result){
							if (!err) { 
								if (result != null) location.reload();
							}
						});
					}, 10000);
				}
			});
		}

		function updateShipStatus(shipId) {
			SpaceShip.viewResourceProduction(shipId, function(error,result) {
				if (!error) {
					renderResourcesLevel(result[3],result[4].toNumber(),result[5].toNumber());
					renderResourcesProduction(result[0].toNumber(),result[1].toNumber(),result[2].toNumber());
					web3.eth.getBlockNumber(function(e,b) {
						if (!e) {
							block = result[6].toNumber() - b;
							if (block < 0)
								block = 0;
							renderCountDownUpgradeBlocks(block);
							updateResourcesInStock(shipId);
						}
					});
				}
				else {
					if (DEBUG) window.alert(error);
					else console.log(error);
				}
			});
		}
		
		document.getElementById("upgrade-graphene-button").addEventListener("click", function() {upgradeResource(ship,1,0);});
		document.getElementById("upgrade-metals-button").addEventListener("click", function() {upgradeResource(ship,2,0);});

		var updateInterval = setInterval(function() {
			updateShipStatus(ship);
		},5000);
	});
});

