import web3

class gameException(Exception):
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return repr(self.value)


class game(object):
    def __init__(self, provider, address, abi):
        naddr = web3.utils.normalizers.to_checksum_address(address)
        self.w3       = web3.Web3(web3.Web3.HTTPProvider(provider))
        self.contract = self.w3.eth.contract(address=naddr, abi=abi)


    def get_ship_by_owner(self, address):
        naddr = web3.utils.normalizers.to_checksum_address(address)
        try:
            data = self.contract.functions.getShipByOwner(naddr).call()
        except Exception as e:
            raise gameException(str(e))

        if data[0]:
            return data[1]
        else:
            raise gameException("ship not in game")

            
    def get_last_block_number(self):
        try:
            block = self.w3.eth.blockNumber
        except Exception as e:
            raise gameException(str(e))

        return {'last_block_number': block}

    def get_block(self, block):
        try:
            return self.w3.eth.getBlock(block)
        except Exception as e:
            raise gameException(str(e))

    
    def view_ship(self, ship_id):
        try:
            data = self.contract.functions.viewShip(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))

        ret = {'ship_name': data[0],
               'position_x': data[1],
               'position_y': data[2],
               'mode': data[3],
               'qaim': data[4],
               'role': data[5],
               'in_port': data[6]}

        return ret


    def view_ship_vars(self, ship_id):
        try:
            data = self.contract.functions.viewShipVars(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))

        ret = {'energy_stock': data[0],
               'graphene_stock': data[1],
               'metal_stock': data[2],
               'countdown_resources': data[3],
               'countdown_buildings': data[4],
               'countdown_move': data[5],
               'countdown_fleet': data[6],
               'countdown_mode': data[7],
               'countdown_wopr': data[8],
               'damage': data[9]}

        return ret


    def view_resource_production(self, ship_id):
        try:
            data = self.contract.functions.viewResourceProduction(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))

        ret = {'energy_production': data[0],
               'graphene_production': data[1],
               'metals_production': data[2],
               'energy_level': data[3],
               'graphene_collector_level': data[4],
               'metals_collector_level': data[5],
               'resource_upgrading': data[6]}

        return ret


    def get_strategic_map(self, x, y):
        ret = {}
        map_size = 13
        try:
            ret['map'] = self.contract.functions.getStrategicMap(x, y).call()
        except Exception as e:
            raise gameException(str(e))

        if x < 3:
            center_x = 3
        elif x > (map_size - 4):
            center_x = map_size - 4
        else:
            center_x = x
            
        if y < 3:
            center_y = 3
        elif y > (map_size - 4):
            center_y = map_size - 4
        else:
            center_y = y
            
        ret['map_center_x'] = ret['map'][49] + 3
        ret['map_center_y'] = ret['map'][50] + 3
        ret['map_size']     = map_size

        return ret


    def get_ships_id(self):
        try:
            ships = self.contract.functions.getShipsId().call()
            cleanlist = []
            for ship in ships:
                if ship != 0 and ship not in cleanlist:
                    cleanlist.append(ship)
            return cleanlist
        except Exception as e:
            raise gameException(str(e))

            
    def get_ship_points(self, ship_id):
        try:
            return self.contract.functions.getShipPoints(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))
            
            
    def view_fleet(self, ship_id):
        try:
            data = self.contract.functions.viewFleet(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))

        ret = {'fleet_type': data[0],
               'fleet_energy_cost': data[1],
               'fleet_graphene_cost': data[2],
               'fleet_metals_cost': data[3],
               'fleet_attack': data[4],
               'fleet_defense': data[5],
               'fleet_distance': data[6],
               'fleet_load': data[7],
               'fleet_size': data[8],
               'fleet_in_production': data[9],
               'fleet_end_production': data[10],
               'fleet_blocks_to_end': data[11]}

        return ret


    def view_building_level(self, ship_id):
        try:
            data = self.contract.functions.viewBuildingLevel(int(ship_id)).call()
        except Exception as e:
            raise gameException(str(e))

        ret = {'warehouse_level': data[0],
               'hangar_level': data[1],
               'wopr_level': data[2],
               'building_upgrading': data[3]}

        return ret
        
        
    def get_game(self):
        try:
            data = self.contract.functions.getGame().call()
        except Exception as e:
            raise gameException(str(e))
    
        ret = {'game_ready': data[0],
               'game_launch': data[1],
               'game_play_value': data[2],
               'game_end_block': data[3],
               'game_reward': data[4],
               'game_players': data[5],
               'game_candidate': data[6],
               'game_winner': data[7] }

        return ret
    

    def get_transaction_receipt(self, tx_hash):
        try:
            ret = self.w3.eth.getTransactionReceipt(tx_hash)
        except Exception as e:
            raise gameException(str(e))

        return ret

    def get_transaction(self, tx_hash):
        try:
            ret = self.w3.eth.getTransaction(tx_hash)
        except Exception as e:
            raise gameException(str(e))

        return ret

    def get_attack_ship_event(self, receipt):
        try:
            data = self.contract.events.AttackShipEvent().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

        return data

    def get_attack_port_event(self, receipt):
        try:
            data = self.contract.events.AttackPortEvent().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

        return data

    def get_port_conquest_event(self, receipt):
        try:
            return self.contract.events.PortConquestEvent().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))            

    def get_fire_cannon_event(self, receipt):
        try:
            return self.contract.events.FireCannonEvent().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

    def get_send_resources_event(self, receipt):
        try:
            data = self.contract.events.SentResourcesEvent().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

        return data
        
    def get_start_play_event(self, receipt):
        try:
            data = self.contract.events.ShipStartPlay().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

        return data
        
    def get_end_play_event(self, receipt):
        try:
            data = self.contract.events.ShipEndPlay().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))

        return data
        
    def get_event(self, event, receipt):
        try:
            event_function = getattr(self.contract.events, event)
            return event_function().processReceipt(receipt)
        except Exception as e:
            raise gameException(str(e))
        