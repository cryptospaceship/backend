import django
import os
#os.environ.setdefault("DJANGO_SETTINGS_MODULE", ".spaceship.settings")
os.environ["DJANGO_SETTINGS_MODULE"] = "spaceship.settings"
django.setup()

from spaceship_app.models import Game
from spaceship_app.models import Order
from spaceship_app.models import Event
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
import web3

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Basic Config
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
LOG_FILE = './log/order_scanner.log'
ERR_FILE = './log/order_scanner.err'
PID_FILE = './pid/order_scanner.pid'


"""
- Por cada juego obtengo el ultimo bloque escaneado
- Obtengo last block
- Por cada bloque, hasta last block, obtengo las transacciones de cada bloque
- Filtro las transacciones con destino la address del contrato
- Por cada transaccion, obtengo los datos y los guardo en la DB
"""

def get_order_receipt(tx_hash, game):
    receipt = game.connect().get_transaction_receipt(tx_hash)
    return receipt

def get_event(tx, game):
    receipt = get_order_receipt(tx['hash'].hex(), game)
    if receipt is not None:
        if receipt.status == 1:
            sp_event = game.connect().get_event('ShipStartPlay', receipt)
            if sp_event != () and sp_event != 'None':
                return sp_event            
    return None
    

def get_orders(tx, game):    
    function = GameAbiFunction.get_by_hash(tx['input'][0:10], game)
    if function is not None:
        for event in function.events:
            get_event(tx, event)
   
    
def get_contract_transactions(block, game):
    for tx in block['transactions']:
        data = game.connect().get_transaction(tx.hex())
        if data['to'] is not None:
            naddr = web3.utils.normalizers.to_checksum_address(data['to'])
            if str(data['to']).lower() == game.address:
                #print(data['input'])
                #data['hash'].hex()
                get_orders(data, game)
        


def block_scanner_main():
    while True:
        #games = Game.objects.filter(enabled=True)
        games = Game.objects.filter(id=11)
        for game in games:
            last_block = game.connect().get_last_block_number()
            while game.scanned_block <= last_block['last_block_number']:
                block = game.connect().get_block(game.scanned_block)
                get_contract_transactions(block, game)
                
                game.scanned_block = game.scanned_block + 1
                
            #game.save()
        time.sleep(30)








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

