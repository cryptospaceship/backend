import django
import os
os.environ["DJANGO_SETTINGS_MODULE"] = "spaceship.settings"
django.setup()

from spaceship_app.models import Stat
from spaceship_app.models import Game


def __calc_energy_level(panels):
    total = 0
    for panel in panels:
        total = total + panel
    #return int(total/len(panels))
    return total
    
    
def __get_ship_vars(game, ship_id):
    ret = game.connect().view_ship(ship_id)
    ret.update(game.connect().view_ship_vars(ship_id))
    ret.update(game.connect().view_resource_production(ship_id))
    ret.update(game.connect().view_fleet(ship_id))
    ret.update(game.connect().view_building_level(ship_id))

    return __data_converter(ret)
    
    
def __data_converter(data):
    ret = {}
    translations = {}
    for key in data.keys():
        if key in translations.keys():
            ret[translation[key]] = data[key]
        else:
            ret[key] = data[key]
                    
    ret['energy_level']         = __calc_energy_level(data['energy_level'])
    ret['energy_production']    = data['energy_production'] + data['fleet_size']
    ret['fleet_attack_points']  = data['fleet_attack'] * data['fleet_size']
    ret['fleet_defense_points'] = data['fleet_defense'] * data['fleet_size']
    ret['military_points']      = ret['fleet_attack_points'] + ret['fleet_defense_points']
    ret['technology_points']    = ret['energy_level'] + ret['graphene_collector_level'] + ret['metals_collector_level'] + ret['warehouse_level'] + ret['hangar_level'] + ret['cannon_level']
    ret['production_points']    = ret['energy_production'] + ret['graphene_production'] + ret['metals_production']
   
    return ret    
        
    

def main():
    games = Game.objects.filter(enabled=True)
    for game in games:
        data = {}
        ships = game.connect().get_ships_id()
        for ship in ships:
            data = __get_ship_vars(game, ship)
            Stat.update(ship, game, data)

            
main()