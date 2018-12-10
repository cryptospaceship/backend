import django
import os
#os.environ.setdefault("DJANGO_SETTINGS_MODULE", ".spaceship.settings")
os.environ["DJANGO_SETTINGS_MODULE"] = "spaceship.settings"
django.setup()

from spaceship_app.models import Network
from spaceship_app.models import CryptoSpaceShip
from spaceship_app.models import Game
from spaceship_app.models import Transaction
from spaceship_app.models import Event
from spaceship_app.models import Ship
from spaceship_app.models import GameAbiEvent
from spaceship_app.models import GameAbiFunction
from spaceship_app.models import DiscordEvent
from spaceship_app.models import Ranking
from spaceship_app.models import Player
from spaceship_app.models import EventInbox

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# System
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
from daemon import Daemon
from sys    import exit
from sys    import argv

import logging
import time
import json
import httplib2

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Basic Config
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
LOG_FILE = './log/block_scanner.log'
ERR_FILE = './log/block_scanner.err'
PID_FILE = './pid/block_scanner.pid'


"""
- Por cada juego obtengo el ultimo bloque escaneado
- Obtengo last block
- Por cada bloque, hasta last block, obtengo las transacciones de cada bloque
- Filtro las transacciones con destino la address del contrato
- Por cada transaccion, obtengo los datos y los guardo en la DB
"""

def post_to_discord(de):
    try: 
        body = json.loads(de.message)
    except Exception as err:
        de.error = "Error loading JSON: %s" % err
        de.status = 'E'
        de.save()
        return False
    
    http = httplib2.Http()
    resp, content = http.request(
        uri=de.game.discord_channel_api,
        method='POST',
        headers={'Content-type': 'application/json'},
        body=json.dumps(body),
    )
    if resp['status'] == '204':
        de.status = 'S'
        de.save()
        return True
    else:
        de.error  = "Error posting. Code: %s - Content: %s" % (resp, content)
        de.status = 'E'
        de.save()
        return False
        
def get_ship_points(game, ship_id):
    try: 
        return game.connect().get_ship_points(ship_id)
    except:
        return None

def get_ship(css, ship_id):
    try:
        return css.connect().get_ship(int(ship_id))
    except:
        return None
        

def get_games_addresses(net):
    ret = {}
    games = Game.get_enabled_by_net(net)
    for game in games:
       ret[str(game.address).lower()] = game
    return ret


def get_transaction_receipt(tx_hash, net):
    try: 
        return net.connect().get_transaction_receipt(tx_hash)
    except:
        return None

        
def get_abi_event(abi_event, receipt):
    try:
        data = abi_event.game.connect().get_event(abi_event.name, receipt)
        if data != () and data != 'None':
            return data
        else:
            return None
    except:
        return None
    
def get_ships_in_game(game):
    try:
        return game.connect().get_ships_id()
    except:
        return None

def get_ship_info(game, ship):
    try:
        return game.connect().view_ship(ship)
    except:
        return None

def get_transaction(tx, net):
    try:
        return net.connect().get_transaction(tx)
    except:
        return None

def get_last_block(net):
    try:
        return net.connect().get_last_block_number()
    except:
        return None

def get_block(block, net):
    try:
        return net.connect().get_block(block)
    except:
        return None

        
def create_update_transaction(tx, net, game, function_name=''):
    transaction = Transaction.get(game, tx['hash'].hex())
    if transaction is None:
        
        if function_name == '':
            function = GameAbiFunction.get_by_hash(tx['input'][0:10], game)
        else:
            function = GameAbiFunction.get_by_name(function_name, game)
      
        if function is not None:
            ship_id = str(int(tx['input'][10:74], 16))
            transaction = Transaction.create(game, function, tx['hash'].hex(), tx['from'], ship_id, tx['input'])
            logging.info("create_transaction(): TX created for game: %s - address: %s - ship_id: %s" % (game.name, game.address, ship_id))
            return transaction
        else:
            logging.info("create_transaction(): abi function not found: %s " % tx['input'][0:10])
            return None
    else:
        return transaction
    
    
def create_event_inbox(event, abi_event):
    EventInbox.create_from(event)
    logging.info("create_event_inbox(): from_event_inbox created: %s - from: %s" % (event.event_type, event.from_ship))
    if event.to_ship != '':
        EventInbox.create_to(event, event.to_ship)
        logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, event.to_ship))
    else:
        meta = event.load_meta()
        if '_to' in meta.keys():
            if type(meta['_to']) is int:
                meta['_to'] = [meta['_to']]
            for to in meta['_to']:
                if to != 0:
                    EventInbox.create_to(event, to)
                    logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, to))
        else:
            ships_id = get_ships_in_game(event.game)
            if ships_id is not None:
                for ship_id in ships_id:
                    if ship_id != event.from_ship:
                        EventInbox.create_to(event, ship_id)
                        logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, ship_id))
            else:
                logging.info("create_event_inbox(): error getting ship ids in game")
                return False
                
    ship = Ship.get_by_id(event.from_ship)
    if ship is not None:
        if abi_event.discord:        
            try:
                msg_vars = {'ship_name': ship.name, 'ship_id': ship.ship_id}
                msg = abi_event.discord_template.format_map(msg_vars)
                de  = DiscordEvent.create(event.game, msg)
                logging.info("create_event_inbox(): discord event created with id %d" % de.id)
            except Exception as err:
                logging.info("create_event_inbox(): error creating discord event: %s" % err)        
    return True

    
def join_game(event, abi_event):
    ship = Ship.get_by_id(event.from_ship)
    if ship is None:
        logging.info("join_game(): getting ship name for id: %s" % (event.from_ship))
        ship_data = get_ship_info(event.game, event.from_ship)
        if ship_data is not None:
            ship      = Ship.create(event.from_ship, ship_data['ship_name'])
            logging.info("join_game(): ship name created: %s" % (ship.name))
        else:
            logging.info("join_game(): error getting ship name from ship_id %s" % event.from_ship)
            return False
    ship.join_game(event.game)
    logging.info("join_game(): ship %s joined to %s" % (event.from_ship, event.game.name))
    Ranking.create(ship, event.game)
    logging.info("join_game(): ranking created for %s in game %s" % (event.from_ship, event.game.name))
    if abi_event.discord:        
        try:
            msg_vars = {'ship_name': ship.name, 'ship_id': ship.ship_id}
            msg = abi_event.discord_template.format_map(msg_vars)
            de  = DiscordEvent.create(event.game, msg)
            logging.info("join_game(): discord event created with id %d" % de.id)
        except Exception as err:
            logging.info("join_game(): error creating discord event: %s" % err)
    return True

    
def exit_game(event, abi_event):
    ship = Ship.get_by_id(event.from_ship)
    if ship is not None:
        ship.exit_game()
        logging.info("exit_game(): ship %s removed from game %s" % (ship.name, event.game.name))
        ranking = Ranking.get(ship, event.game)
        ranking.delete()
        logging.info("exit_game(): ship %s removed from ranking in game %s" % (ship.name, event.game.name))
    else:
        logging.info("exit_game(): ship %s not found" % event.from_ship)
        return False
    if abi_event.discord:        
        try:
            msg_vars = {'ship_name': ship.name, 'ship_id': ship.ship_id}
            msg = abi_event.discord_template.format_map(msg_vars)
            de  = DiscordEvent.create(event.game, msg)
            logging.info("exit_game(): discord event created with id %d" % de.id)
        except Exception as err:
            logging.info("exit_game(): error creating discord event: %s" % err)
    return True   
    
    
def create_update_event(tx, net, abi_event, receipt):
    logging.info("create_event(): getting events from tx: %s" % tx.hash)
    data = get_abi_event(abi_event, receipt)
    if data is not None:
        event = Event.get(abi_event.game, tx, abi_event.name)
        if event is None:
            event = Event.create(abi_event.game, tx, abi_event.name, data)
        if abi_event.notif_trigger:
            ret = create_event_inbox(event, abi_event)
        elif abi_event.join_trigger:
            ret = join_game(event, abi_event)
        elif abi_event.exit_trigger:
            ret = exit_game(event, abi_event)
    else:
        logging.info("create_event(): error getting events")
        return False
        
    return ret 
    
    
    
def scan_block(block, net):
    for tx in block['transactions']:
        data    = get_transaction(tx.hex(), net)
        address = get_games_addresses(net)
        css     = CryptoSpaceShip.get_by_network(net)
        
        if data is None:
            return False
           
        addr = str(data['to']).lower()               
        if addr == css.address.lower():
            receipt = get_transaction_receipt(tx.hex(), net)
            
            if receipt is None:
                return False
                
            for log in receipt['logs']:
                addr = log['address'].lower()
                if addr in address.keys():
                    create_update_transaction(data, net, address[addr], 'removeShip')
        
        elif addr in address.keys():
            transaction = create_update_transaction(data, net, address[addr])
            if transaction is None:
                return False
    return True
            
            
def scan_transactions(net):
    games = Game.get_enabled_by_net(net)
    for game in games:
        transactions = Transaction.get_pending_queue(game)
        for tx in transactions:
            receipt = get_transaction_receipt(tx.hash, net)
            if receipt is not None:
                if receipt.status == 0:
                    tx.delete()
                    continue
                function = GameAbiFunction.get_by_name(tx.action, game)
                for abi_event in function.events.all():
                    event_created = create_update_event(tx, net, abi_event, receipt)
                    if not event_created:
                        return                
                tx.scan(receipt.blockNumber, receipt.gasUsed)
            else:
                return

                
def post_discord_events(net):
    games = Game.get_enabled_by_net(net)
    for game in games:
        events = DiscordEvent.get_pending_queue(game)
        for event in events:
            post_to_discord(event)

# No se esta usando            
def get_points_from_event(event):
    meta = event.load_meta()
    if '_from' in meta:
        points = get_ship_points(event.game, meta['_from'])
        if points is not None:
            ship    = Ship.get_by_id(meta['_from'])
            ranking = Ranking.get(ship, event.game)
            if ranking is not None:
                r.update(points)
    if '_to' in meta:
        if type(meta['_to']) is int:
            meta['_to'] = [meta['_to']]
        for to in meta['_to']:
            ship = Ship.get_by_id(to)
            if ship is not None:
                ranking = Ranking.get(ship, event.game)
                r.update(points)
    
                      
def get_points(net):
    games = Game.get_enabled_by_net(net)
    for game in games:
        ranking = Ranking.list(game)
        for r in ranking[0]:
            points = get_ship_points(game, r.ship.ship_id)
            if points is not None:
                logging.info("get_points(): update points for ship %s in game %s" % (r.ship.ship_id, game))
                r.update(points)

def get_ships_owner(net):
    css  = CryptoSpaceShip.get_by_network(net)
    games = Game.get_enabled_by_net(net)
    for game in games:
        ranking = Ranking.list(game)
        for r in ranking[0]:
            ship = get_ship(css, int(r.ship.ship_id))
            if ship is not None:
                player = Player.get_by_address(ship['owner'].lower())
                logging.info("get_ships_owner(): update owner for ship %s: %s" % (r.ship.ship_id, player.user.username))
                r.ship.set_player(player)
            

   
            
def block_scanner_main():
    logging.basicConfig(format   = '%(asctime)s - block_scanner.py -[%(levelname)s]: %(message)s',
                        filename = LOG_FILE,
                        level    = logging.INFO)

    while True:
        net = Network.get_by_net_id(42)
        last_block = get_last_block(net)
        if last_block is not None:
            last_scanned_block = net.scanned_block
            while last_scanned_block < last_block:
                last_scanned_block = last_scanned_block + 1   
                print(last_scanned_block)
                block = get_block(last_scanned_block, net)
                if block is not None:
                    logging.info("block_scanner_main(): scanning block: %s" % last_scanned_block)
                    block_scanned = scan_block(block, net)
                    if block_scanned:
                        net.scanned_block = last_scanned_block
                        net.save()
                        logging.info("block_scanner_main(): block scanned: %s " % net.scanned_block)
                        scan_transactions(net)
                        post_discord_events(net)
                    else:
                        logging.info("block_scanner_main(): error scanning block: %s" % last_scanned_block)
                        break
                        
                    if last_scanned_block % net.points_interval == 0:
                        get_ships_owner(net)
                        get_points(net)
                        
   
        time.sleep(net.scanner_sleep)


class DaemonMain(Daemon):
    def run(self):
        try:
            block_scanner_main()
        except KeyboardInterrupt:
            exit()

if __name__ == "__main__":
    daemon = DaemonMain(PID_FILE, stdout=LOG_FILE, stderr=ERR_FILE)
    if len(argv) == 2:
        if 'start'     == argv[1]:
            daemon.start()
        elif 'stop'    == argv[1]:
            daemon.stop()
        elif 'restart' == argv[1]:
            daemon.restart()
        elif 'run'     == argv[1]:
            daemon.run()
        elif 'status'  == argv[1]:
            daemon.status()
        else:
            print("Unknown command")
            exit(2)
        exit(0)
    else:
        print("usage: %s start|stop|restart|run" % argv[0])
        exit(2)

