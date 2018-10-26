import web3

class spaceShipException(Exception):
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return repr(self.value)


class spaceShip(object):
    def __init__(self, provider, address, abi):
        w3    = web3.Web3(web3.Web3.HTTPProvider(provider))
        naddr = web3.utils.normalizers.to_checksum_address(address)
        self.contract = w3.eth.contract(address=naddr, abi=abi)


    def get_ship(self, ship_id):
        try:
            data = self.contract.functions.getShip(ship_id).call()
        except Exception as e:
            raise spaceShipException(str(e))

        ret = {'id': ship_id,
               'name': data[0],
               'color': data[1],
               'in_game': data[2],
               'owner': data[3],
               'level': data[4],
               'takedowns': data[5],
               'wins': data[6],
               'loses': data[7],
               'launch': data[8]
              }

        return ret


    def get_ships_by_owner(self, addr):
        naddr =  web3.utils.normalizers.to_checksum_address(addr)
        try:
            data = self.contract.functions.getShipsByOwner(naddr).call()
        except Exception as e:
            raise spaceShipException(str(e))

        ret = []
        for ss_id in data:
            ss = self.get_ship(ss_id)
            ret.append(ss)

        return ret


    def get_creation_ship_price(self):
        try:
            data = self.contract.functions.getCreationShipPrice().call()
        except Exception as e:
            raise spaceShipException(str(e))

        return float(web3.Web3.fromWei(data, 'ether'))


    def get_game(self, game_id):
        try:
            data = self.contract.functions.getGame(game_id).call()
        except Exception as e:
            raise spaceShipException(str(e))

        ret = {'name': data[0],
               'address': data[1],
               'id': data[2],
               'players': data[3],
               'game_start': data[4],
               'price': float(web3.Web3.fromWei(data[5], 'ether')),
               'jackpot': float(web3.Web3.fromWei(data[6], 'ether')) }

        return ret


    def get_all_games(self):
        try:
            data = self.contract.functions.getAllGames().call()
        except Exception as e:
            raise spaceShipException(str(e))

        ret = []
        for g_id in data:
            g = self.get_game(g_id)
            ret.append(g)

        return ret

        
    def get_ship_game(self, ship_id):
        try:
            data = self.contract.functions.getShipGame(ship_id).call()
        except Exception as e:
            raise spaceShipException(str(e))

        return data

    
    def get_ship_qaim(self, ship_id):
        try:
            data = self.contract.functions.getShipQAIM(ship_id).call()
        except Exception as e:
            raise spaceShipException(str(e))
            
        return data
        
        
    def get_unassigned_points(self, ship_id):
        try:
            data = self.contract.functions.getUnassignedPoints(ship_id).call()
        except Exception as e:
            raise spaceShipException(str(e))
            
        return data
