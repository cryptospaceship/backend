import django
import os
#os.environ.setdefault("DJANGO_SETTINGS_MODULE", ".spaceship.settings")
os.environ["DJANGO_SETTINGS_MODULE"] = "spaceship.settings"
django.setup()

from spaceship_app.models import Game
from spaceship_app.models import Order
from spaceship_app.models import Event

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# System
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
from daemon import Daemon
from sys    import exit
from sys    import argv

import logging
import time

#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Basic Config
#+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
LOG_FILE = './log/event_daemon.log'
ERR_FILE = './log/event_daemon.err'
PID_FILE = './pid/event_daemon.pid'

def get_order_data(order):
    data = order.game.connect().get_transaction(order.tx_hash)
    return data

def get_order_receipt(order):
    receipt = order.game.connect().get_transaction_receipt(order.tx_hash)
    return receipt

def confirm_order(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        print(get_order_data(order))
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return

def attack_ship_event(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        if receipt.status == 1:
            event = order.game.connect().get_attack_ship_event(receipt)
            Event.create_attack_ship(order, event)
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return

def attack_port_event(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        if receipt.status == 1:
            event_attack = order.game.connect().get_attack_port_event(receipt)
            Event.create_attack_port(order, event_attack)
            event_conquest = order.game.connect().get_port_conquest_event(receipt)
            if event_conquest != ():
                Event.create_port_conquest(order, event_conquest)
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return

def port_conquest_event(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        if receipt.status == 1:
            event = order.game.connect().get_port_conquest_event(receipt)
            Event.create_port_conquest(order, event)
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return

def fire_cannon_event(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        if receipt.status == 1:
            event = order.game.connect().get_fire_cannon_event(receipt)
            Event.create_fire_cannon(order, event)
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return

def send_resources_event(order):
    receipt = get_order_receipt(order)
    if receipt is not None:
        if receipt.status == 1:
            event = order.game.connect().get_send_resources_event(receipt)
            Event.create_send_resources(order, event)
        order.confirm(receipt.blockNumber, receipt.gasUsed)
    return


def check_order(order):
    if order.action.name == "attack_ship":
        attack_ship_event(order)
    elif order.action.name == "attack_port":
        attack_port_event(order)
    elif order.action.name == "port_conquest":
        port_conquest_event(order)
    elif order.action.name == "fire_cannon":
        fire_cannon_event(order)
    elif order.action.name == "send_resources":
        send_resources_event(order)
    else:
        confirm_order(order)



def eventd_main():
    #i = 0
    #while i == 0:
    while True:
        #i = i + 1
        orders = Order.objects.filter(confirmed=False)
        for order in orders:
            check_order(order)

        time.sleep(30)


class DaemonMain(Daemon):
    def run(self):
        try:
            eventd_main()
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






