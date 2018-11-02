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

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# System
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
from daemon import Daemon
from sys    import exit
from sys    import argv

import logging
import time
import json
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

def get_games_addresses(net):
    ret = {}
    games = Game.get_enabled_by_net(net)
    for game in games:
       ret[str(game.address).lower()] = game
    return ret
    
def get_transaction_receipt(tx_hash, net):
    return net.connect().get_transaction_receipt(tx_hash)

def create_event_inbox(event):
    EventInbox.create_from(event)
    logging.info("create_event_inbox(): from_event_inbox created: %s - from: %s" % (event.event_type, event.ship_from))
    if event.to_ship != '':
        EventInbox.create_to(event, event.to_ship)
        logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, event.ship_to))
    else:
        meta = event.load_meta()
        if '_to' in meta.keys():
            for to in meta['_to']:
                if to != 0:
                    EventInbox.create_to(event, to)
                    logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, to))
        else:
            ships_id = event.game.connect().get_ships_id()
            for ship_id in ships_id:
                if ship_id != event.from_ship:
                    EventInbox.create_to(event, ship_id)
                    logging.info("create_event_inbox(): from_event_inbox created: %s - to: %s" % (event.event_type, ship_id))
    return

def join_game(event):
    ship = Ship.get_by_id(event.from_ship)
    if ship is None:
        logging.info("join_game(): getting ship name for id: %s" % (event.from_ship))
        ship_data = event.game.connect().view_ship(event.from_ship)
        ship      = Ship.create(event.from_ship, ship_data['ship_name'])
        logging.info("join_game(): ship name created: %s" % (ship.name))
    ship.join_game(event.game)
    logging.info("join_game(): ship %s joined to %s" % (event.from_ship, event.game.name))
    return

def exit_game(event):
    ship = Ship.get_by_id(event.from_ship)
    if ship is not None:
        ship.exit_game()
        logging.info("exit_game(): ship %s removed from game %s" % (ship.name, event.game.name))
    return    
    
def create_event(tx, net, abi_event, receipt):
    logging.info("create_event(): getting events from tx: %s" % str(tx['hash'].hex()))
    data = abi_event.game.connect().get_event(abi_event.name, receipt)
    if data != () and data != 'None':
        event = Event.create(abi_event.game, abi_event.name, data)
        if abi_event.notif_trigger:
            create_event_inbox(event)
        if abi_event.join_trigger:
            join_game(event)
        if abi_event.exit_trigger:
            exit_game(event)
    else:
        logging.info("create_event(): error getting events")
    return

def create_transaction(tx, net, game, receipt):
    function = GameAbiFunction.get_by_hash(tx['input'][0:10], game)
    if function is not None:        
        transaction = Transaction.create(game, function, tx['hash'].hex())
        logging.info("create_transaction(): TX created for game: %s - address: %s " % (game.name, game.address))
        for abi_event in function.events.all():
            create_event(tx, net, abi_event, receipt)
        transaction.scanned(receipt.blockNumber, receipt.gasUsed)
    else:
        logging.info("create_transaction(): abi function not found: %s " % tx['input'][0:10])
    return

def create_exit_transaction(tx, net, game, receipt):
    function = GameAbiFunction.get_by_name('removeShip', game)
    transaction = Transaction.create(game, function, tx['hash'].hex())
    logging.info("create_exit_transaction(): TX created for game: %s - address: %s " % (game.name, game.address))
    for abi_event in function.events.all():
        create_event(tx, net, abi_event, receipt)
    transaction.scanned(receipt.blockNumber, receipt.gasUsed)
    return
    
def scan_transactions(block, net):
    for tx in block['transactions']:
        data    = net.connect().get_transaction(tx.hex())
        address = get_games_addresses(net)
        css     = CryptoSpaceShip.get_by_network(net)
        
        if data['to'] is not None:
            addr = str(data['to']).lower()
            receipt = get_transaction_receipt(data['hash'].hex(), net)
            
            if receipt is not None:
                if addr == css.address.lower():                
                    for log in receipt['logs']:
                        addr = log['address'].lower()
                        if addr in address.keys():
                            create_exit_transaction(data, net, address[addr], receipt)
                elif addr in address.keys():
                    create_transaction(data, net, address[addr], receipt)
    return    


def block_scanner_main():
    logging.basicConfig(format   = '%(asctime)s - block_scanner.py -[%(levelname)s]: %(message)s',
                        filename = LOG_FILE,
                        level    = logging.INFO)
                        
    while True:
        net = Network.get_by_net_id(42)
        last_block = net.connect().get_last_block_number()
        while net.scanned_block < last_block:
            net.scanned_block = net.scanned_block + 1
            block = net.connect().get_block(net.scanned_block)
            if block is not None:
                logging.info("block_scanner_main(): scanning block: %s" % net.scanned_block)
                scan_transactions(block, net)
                net.save()
                logging.info("block_scanner_main(): block scanned: %s " % net.scanned_block)
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

