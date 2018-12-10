from __future__ import unicode_literals
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from django.utils import dateformat

import json
import web3

#from .crypto_spaceship import spaceShip
#from .crypto_game import game
from .libs import crypto_game_v1_4
from .libs import crypto_game_v1_5
from .libs import network_utils

from .libs.crypto_spaceship import spaceShip

#from .misc import calc_function_hash

# Create your models here.

class Var(models.Model):

    DATA_TYPES = ( ('I', 'Integer'),
                   ('F', 'Float'),
                   ('S', 'String'),
                   ('L', 'Long') )

    key      = models.CharField(max_length=20, unique=True)
    value    = models.CharField(max_length=100)
    dtype    = models.CharField(max_length=1, choices=DATA_TYPES)

    @classmethod
    def get_var(cls,key,cast=True):
        try:
            v = cls.objects.get(key=key)
            if cast:
                return v.cast()
            else:
                return v
        except ObjectDoesNotExist:
            return None

    def cast(self):
        if self.dtype == 'I':
            return int(self.value)
        if self.dtype == 'F':
            return float(self.value)
        if self.dtype == 'L':
            return long(self.value)
        if self.dtype == 'S':
            return self.value

    def __str__(self):
        return '%s:%s' % (self.key,self.value)


class Message(models.Model):
    sender   = models.ForeignKey('Ship', related_name='msg_from', on_delete=models.CASCADE)
    receiver = models.ForeignKey('Ship', related_name='msg_to', on_delete=models.CASCADE)
    game     = models.ForeignKey('Game', on_delete=models.CASCADE)
    subject  = models.CharField(max_length=250)
    message  = models.TextField(max_length=1000)
    read     = models.BooleanField()
    date     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)
    
    def serialize(self, qt=''):
        ret = {}
        ret['id'] = self.id
        if qt == 'inbox':
            ret['from']    = self.sender.name
            ret['subject'] = self.subject
            ret['date']    = dateformat.format(self.date, 'N j, Y, P')
            ret['read']    = self.read
        elif qt == 'outbox':
            ret['to']    = self.sender.name
            ret['subject'] = self.subject
            ret['date']    = dateformat.format(self.date, 'N j, Y, P')
        else:
            ret['from']    = self.sender.name
            ret['to']      = self.receiver.name
            ret['subject'] = self.subject
            ret['message'] = self.message
            ret['date']    = dateformat.format(self.date, 'N j, Y, P')
            ret['read']    = self.read
        return ret
    
    @classmethod
    def create(cls, sender, receiver, subject, message):
        msg = cls()
        msg.sender   = sender
        msg.receiver = receiver
        msg.subject  = subject
        msg.message  = message
        msg.game     = sender.game
        msg.read     = False
        msg.save()
        return msg
    
    """
    @classmethod
    def get_by_sender(cls, ship):
        return cls.objects.filter(sender=ship, game=sender.game)
        
    @classmethod
    def get_by_receiver(cls, ship):
        return cls.objects.filter(receiver=ship, game=receiver.game)
    """
    
    @classmethod
    def get_by_id(cls, id, ship=None):       
        try:
            msg = cls.objects.get(id=id)
        except:
            return None
               
        if ship == msg.receiver:
            msg.mark_as_read()            
        
        return msg
        
        
        
    @classmethod
    def get_inbox_unread_count(cls, ship_id):
        ship = Ship.get_by_id(ship_id)
        return cls.objects.filter(receiver=ship, game=ship.game, read=False).count()
        
    @classmethod
    def get_outbox_unread_count(cls, ship_id):
        ship = Ship.get_by_id(ship_id)
        return cls.objects.filter(sender=ship, game=ship.game).count()
    
    @classmethod
    def get_inbox_list(cls, ship_id, serialized=False):
        print(ship_id)
        ship = Ship.get_by_id(ship_id)
        msgs = cls.objects.filter(receiver=ship, game=ship.game).order_by('-id')
        if serialized:
            ret = []
            for msg in msgs:
                data = msg.serialize('inbox')
                ret.append(data)
            return ret
        else:
            return msgs
    
    @classmethod
    def get_outbox_list(cls, ship_id, serialized=False):
        ship = Ship.get_by_id(ship_id)
        msgs = cls.objects.filter(sender=ship, game=ship.game).order_by('-id')
        if serialized:
            ret = []
            for msg in msgs:
                data = msg.serialize('outbox')
                ret.append(data) 
            return ret
        else:
            return msgs
            
    @classmethod
    def get_inbox_since_id(cls, ship_id, msg_id, serialized=False):
        ship = Ship.get_by_id(ship_id)
        msgs = cls.objects.filter(receiver=ship, game=ship.game, id__gt=msg_id).order_by('-id')
        if serialized:
            ret = []
            for msg in msgs:
                #data = {'id': msg.id, 'from': msg.sender.name, 'subject': msg.subject, 'read': msg.read, 'date': msg.date.strftime("%c")}
                data = msg.serialize('inbox')
                ret.append(data) 
            return ret
        else:
            return msgs
    
            
    def mark_as_read(self):
        self.read = True
        self.save()
        return self
    

class Player(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE)
    address     = models.CharField(max_length=42)
    last_block  = models.IntegerField(default=0)
    messages    = models.ManyToManyField('Message', blank=True)

    def __str__(self):
        return '%s' % str(self.user.username)

    @classmethod
    def get_by_address(cls,address):
        try:
            return cls.objects.get(address=address)
        except:
            return None

    @classmethod
    def get_by_user(cls,user):
        try:
            return cls.objects.get(user=user)
        except:
            return None
            
    @classmethod
    def get_by_username(cls, username):
        try:
            user = User.objects.get(username=username)
        except:
            return None
        return cls.objects.get(user=user)
        
    def get_ship_in_game(self, game):
        try:
            ship_id = game.connect().get_ship_by_owner(self.address)
            ship    = Ship.get_by_id(ship_id)
            return ship
        except:
            return None
        
        

class JSClient(models.Model):
    view = models.CharField(max_length=250)
    js   = models.CharField(max_length=250)

    def __str__(self):
        return '%s:%s' % (self.view,self.js)


###########################################################################
class Gas(models.Model):
    name = models.CharField(max_length=32)

    def __str__(self):
        return self.name

       
class Network(models.Model):
    name            = models.CharField(max_length=32)
    gas             = models.ForeignKey(Gas, on_delete=models.CASCADE)
    net_id          = models.IntegerField()
    proxy           = models.CharField(max_length=128)
    explorer        = models.CharField(max_length=256, blank=True)
    scanned_block   = models.IntegerField(default=0)
    scanner_sleep   = models.IntegerField(default=5)
    points_interval = models.IntegerField(default=100, help_text="Intervalo en bloques para get_points")

    def __str__(self):
        return self.name

    @classmethod
    def get_by_net_id(cls, net_id):
        try:
            return cls.objects.get(net_id=net_id)
        except:
            return None        

    def connect(self):        
        return network_utils.network(self.proxy)
        
        
class CryptoSpaceShip(models.Model):
    name    = models.CharField(max_length=128)
    version = models.IntegerField()
    network = models.ForeignKey(Network, on_delete=models.CASCADE)
    address = models.CharField(max_length=128)
    abi     = models.TextField()
    enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @classmethod
    def get_by_network(cls, network):
        try:
            return cls.objects.get(network=network, enabled=True)
        except:
            return None        

    @classmethod
    def get_by_net_id(cls, net_id):
        network = Network.get_by_net_id(net_id)
        return cls.get_by_network(network)

    def connect(self):
        print (self.address)
        return spaceShip(self.network.proxy, self.address, self.abi)

       
class Version(models.Model):
    name = models.CharField(max_length=16)
    
    def __str__(self):
        return self.name

class Game(models.Model):
    name                = models.CharField(max_length=128)
    version             = models.ForeignKey(Version, on_delete=models.CASCADE, blank=True, null=True)
    network             = models.ForeignKey(Network, on_delete=models.CASCADE)
    address             = models.CharField(max_length=128)
    abi                 = models.TextField()
    contract_id         = models.IntegerField()
    deployed_at         = models.IntegerField()
    discord_channel_api = models.CharField(max_length=256, blank=True)
    enabled             = models.BooleanField(default=False)
    load_abi_trigger    = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super(Game, self).save(*args, **kwargs)
        if self.load_abi_trigger:
            GameAbiFunction.delete_game(self)
            GameAbiEvent.delete_game(self)   
            self.load_abi()
            self.load_abi_trigger = False
            super(Game, self).save(*args, **kwargs)
        
        
    @classmethod
    def get_by_id(cls, game_id):
        try:
            return cls.objects.get(id=game_id)
        except:
            return None

    @classmethod
    def get_by_contract_id(cls, contract_id, net_id):
        network = Network.get_by_net_id(net_id)
        if network is None:
            return None
        try:
            return cls.objects.get(contract_id=contract_id, network=network)
        except:
            return None        
    
    @classmethod
    def get_by_net(cls, net):
        return cls.objects.filter(network=net)
        
    @classmethod
    def get_enabled_by_net(cls, net):
        return cls.objects.filter(network=net, enabled=True)

    def connect(self):
        if self.version.name == "1.4":
            return crypto_game_v1_4.game(self.network.proxy, self.address, self.abi)
        elif self.version.name == "1.5":
            return crypto_game_v1_5.game(self.network.proxy, self.address, self.abi)
        else:
            return None
    
    @staticmethod
    def calc_function_hash(function):
        f = "%s(" % function['name']
        for input in function['inputs']:
            f = "%s%s," % (f, input['type'])
        f = f[:-1] + ')'    
        hash = web3.Web3.sha3(f.encode()).hex()
        return hash[0:10]    
    
    def load_abi(self):             
        abi = json.loads(self.abi)
        for e in abi:
            if e['type'] == 'function':
                name = e['name']
                hash = self.calc_function_hash(e)
                GameAbiFunction.create(name, hash, self)
            if e['type'] == 'event':
                GameAbiEvent.create(e['name'], self)
                

class GameTemplate(models.Model):
    version = models.ForeignKey(Version, on_delete=models.CASCADE)
    view    = models.CharField(max_length=64)
    file    = models.CharField(max_length=255)    
    
    
    def __str__(self):
        return "%s_%s" %(str(self.version), self.view)
    
    @classmethod
    def get(cls, version, view):
        try:
            return cls.objects.get(version=version, view=view)
        except:
            return None
            
    def get_js(self):
        ret = []
        gs = GameStatic.objects.filter(game_template=self, file_type='js').order_by("order")
        for js in gs:
            ret.append(js.file)
        return ret

    def get_css(self):
        ret = []
        gs = GameStatic.objects.filter(game_template=self, file_type='css').order_by("order")
        for css in gs:
            ret.append(css.file)
        return ret
        
            
class GameStatic(models.Model):
    FILE_TYPES = ( ('css', 'CSS'),
                   ('js', 'JS') )

    name          = models.CharField(max_length=64)
    game_template = models.ManyToManyField(GameTemplate)
    file_type     = models.CharField(max_length=3, choices=FILE_TYPES)
    file          = models.CharField(max_length=255)
    order         = models.IntegerField(default=1)
        
    def __str__(self):
        return str(self.name)


class SiteTemplate(models.Model):
    view    = models.CharField(max_length=64)
    file    = models.CharField(max_length=255)
    
    def __str__(self):
        return str(self.view)

    @classmethod
    def get_file(cls, view):
        try:
            return cls.objects.get(view=view).file
        except:
            return None

    @classmethod
    def get(cls, view):
        try:
            return cls.objects.get(view=view)
        except:
            return None 

    def get_js(self):
        ret = []
        ss = SiteStatic.objects.filter(site_template=self, file_type='js').order_by("order")
        for js in ss:
            ret.append(js.file)
        return ret

    def get_css(self):
        ret = []
        ss = SiteStatic.objects.filter(site_template=self, file_type='css').order_by("order")
        for css in ss:
            ret.append(css.file)
        return ret
        
            
class SiteStatic(models.Model):
    FILE_TYPES = ( ('css', 'CSS'),
                   ('js', 'JS') )

    name          = models.CharField(max_length=64)
    site_template = models.ManyToManyField(SiteTemplate)
    file_type     = models.CharField(max_length=3, choices=FILE_TYPES)
    file          = models.CharField(max_length=255)
    order         = models.IntegerField(default=1)
    
    def __str__(self):
        return str(self.name)
    
    
class Event(models.Model):
    """
    EVENT_TYPES = (('AS', 'Attack Ship'),
                   ('AP', 'Attack Port'),
                   ('PC', 'Port Conquest'),
                   ('FC', 'Fire Cannon'),
                   ('SR', 'Send Resources'))
    """
    
    game        = models.ForeignKey(Game, on_delete=models.CASCADE)
    transaction = models.ForeignKey('Transaction', on_delete=models.CASCADE)
    event_type  = models.CharField(max_length=128)
    event_block = models.IntegerField()
    from_ship   = models.IntegerField(blank=True, null=True)
    to_ship     = models.IntegerField(blank=True, null=True)
    event_meta  = models.TextField()

    def __str__(self):
        return str(self.id)

    @classmethod
    def create_attack_ship(cls, tx, data):
        event             = cls()
        event.game        = tx.game
        event.event_type  = 'AS'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)

    @classmethod
    def create_attack_port(cls, tx, data):
        event             = cls()
        event.game        = tx.game
        event.event_type  = 'AP'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        for to in data[0].args._to:
            if to != 0:
                EventInbox.create_to(event, to)

    @classmethod
    def create_port_conquest(cls, tx, data):
        event             = cls()
        event.game        = tx.game
        event.event_type  = 'PC'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        ships = tx.game.connect().get_ships_id()
        for ship in ships:
            if ship != event.from_ship:
                EventInbox.create_to(event, ship)

    @classmethod
    def create_fire_cannon(cls, tx, data):
        event             = cls()
        event.game        = tx.game
        event.event_type  = 'FC'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)

    @classmethod
    def create_send_resources(cls, tx, data):
        event             = cls()
        event.game        = tx.game
        event.event_type  = 'SR'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)

    @classmethod
    def create(cls, game, transaction, event_type, data):
        event             = cls()
        event.game        = game
        event.transaction = transaction
        event.event_type  = event_type
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        if '_to' in dict(data[0].args):
            event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()
        return event

    @classmethod
    def get(cls, game, transaction, event_type):
        try:
            return cls.objects.get(game=game, transaction=transaction, event_type=event_type)
        except ObjectDoesNotExist:
            return None
        
    def load_meta(self):
        return json.loads(self.event_meta.replace("'", "\"").replace("False", "false").replace("True", "true"))
        
        
class EventInbox(models.Model):
    INBOX_TYPE = (('F', 'From'),
                  ('T', 'To'))

    game          = models.ForeignKey(Game, on_delete=models.CASCADE)
    ship_id       = models.IntegerField()
    event         = models.ForeignKey(Event, on_delete=models.CASCADE)
    inbox_type    = models.CharField(max_length=1, choices=INBOX_TYPE)
    viewed        = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True, auto_now=False)

    def __str__(self):
        return '%s_%s_%s' %(self.id, self.event, self.ship_id)

    def view(self):
        self.viewed = True
        self.save()

    @classmethod
    def create_from(cls, event):
        event_inbox            = cls()
        event_inbox.game       = event.game
        event_inbox.ship_id    = event.from_ship
        event_inbox.event      = event
        event_inbox.inbox_type = 'F'
        event_inbox.viewed     = False
        event_inbox.save()

    @classmethod
    def create_to(cls, event, ship_id):
        event_inbox            = cls()
        event_inbox.game       = event.game
        event_inbox.ship_id    = ship_id
        event_inbox.event      = event
        event_inbox.inbox_type = 'T'
        event_inbox.viewed     = False
        event_inbox.save()

    @classmethod
    def not_read_count(cls, game_id, ship_id):
        game = Game.get_by_id(game_id)
        if game is not None:
            return cls.objects.filter(game=game, ship_id=ship_id, viewed=False).count()
        else:
            return 0

    @classmethod
    def not_read_ids(cls, game_id, ship_id):
        ret  = []
        game = Game.get_by_id(game_id)
        if game is not None:
            events = cls.objects.filter(game=game, ship_id=ship_id, viewed=False)
            for event in events:
                ret.append(event.id)
        return ret


    @classmethod
    def get_by_id(cls, event_id):
        try:
            return cls.objects.get(id=event_id)
        except:
            return None

    @classmethod
    def get_by_ship_id(cls, ship_id):
        o = cls.objects.filter(ship_id=ship_id).order_by('-id')
        for i in o:
            print(i.event.event_meta.replace("'", "\""))
            i.event_meta_parsed = json.loads(i.event.event_meta.replace("'", "\"").replace("False", "false").replace("True", "true"))
            print (i.event_meta_parsed)
        return o

class Action(models.Model):
    name = models.CharField(max_length=32)

    def __str__(self):
        return self.name

    @classmethod
    def get(cls, name):
        try:
            return cls.objects.get(name=name)
        except:
            return None
            

class Transaction(models.Model):
    game          = models.ForeignKey(Game, on_delete=models.CASCADE)
    from_address  = models.CharField(max_length=42, default='0x0')
    ship_id       = models.CharField(max_length=4, default="0000")    
    action        = models.CharField(max_length=128)
    hash          = models.CharField(max_length=128)
    input         = models.TextField(default='')
    at_block      = models.IntegerField(blank=True, null=True)
    gas_expended  = models.IntegerField(blank=True, null=True)
    scanned       = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True, auto_now=False)

    def __str__(self):
        return self.hash

    @classmethod
    def create(cls, game, action, hash, address, ship_id, input):
        tx = cls()
        tx.game         = game
        tx.action       = action.name
        tx.hash         = hash
        tx.from_address = address
        tx.ship_id      = ship_id
        tx.input        = input
        tx.save()
        return tx
    
    @classmethod
    def delete_in_block(block):
        Transaction.objects.filter(at_block=block).delete()
        
    @classmethod
    def get_pending_queue(cls, game):
        return cls.objects.filter(game=game, scanned=False).order_by('-id')
    
    def scan(self, block, gas):
        self.at_block     = block
        self.gas_expended = gas
        self.scanned      = True
        self.save()
        return self
    
    @classmethod
    def get(cls, game, hash):
        try:
            return cls.objects.get(game=game, hash=hash)
        except ObjectDoesNotExist:
            return None
            

class Stat(models.Model):
    ship_id                    = models.IntegerField()
    ship_name                  = models.CharField(max_length=32, blank=True)
    game                       = models.ForeignKey(Game, on_delete=models.CASCADE)
    wins                       = models.IntegerField(blank=True, null=True)
    loses                      = models.IntegerField(blank=True, null=True)
    destructions               = models.IntegerField(blank=True, null=True)
    deaths                     = models.IntegerField(blank=True, null=True)
    energy_stock               = models.IntegerField(blank=True, null=True)
    graphene_stock             = models.IntegerField(blank=True, null=True)
    metal_stock                = models.IntegerField(blank=True, null=True)
    energy_production          = models.IntegerField(blank=True, null=True)
    graphene_production        = models.IntegerField(blank=True, null=True)
    metals_production          = models.IntegerField(blank=True, null=True)
    energy_level               = models.IntegerField(blank=True, null=True)
    graphene_collector_level   = models.IntegerField(blank=True, null=True)
    metals_collector_level     = models.IntegerField(blank=True, null=True)
    fleet_size                 = models.IntegerField(blank=True, null=True)
    warehouse_level            = models.IntegerField(blank=True, null=True)
    hangar_level               = models.IntegerField(blank=True, null=True)
    cannon_level               = models.IntegerField(blank=True, null=True)
    fleet_attack_points        = models.IntegerField(blank=True, null=True)
    fleet_defense_points       = models.IntegerField(blank=True, null=True)
    military_points            = models.IntegerField(blank=True, null=True)
    production_points          = models.IntegerField(blank=True, null=True)
    technology_points          = models.IntegerField(blank=True, null=True)
    
    
    def __str__(self):
        return str(self.id)

    @classmethod
    def update(cls, ship_id, game, data):
        try:
            stat = Stat.objects.get(ship_id=ship_id, game=game)
        except ObjectDoesNotExist:
            stat = cls()
            stat.ship_id = ship_id
            stat.game    = game
            
        for key in data.keys():
            if hasattr(stat, key):
                stat.__setattr__(key, data[key])
        
        stat.save()    
        return stat


class Ship(models.Model):
    ship_id = models.IntegerField()
    name    = models.CharField(max_length=128)
    game    = models.ForeignKey(Game, on_delete=models.CASCADE, null=True)
    player  = models.ForeignKey(Player, on_delete=models.CASCADE, null=True)
    
    def __str__(self):
        return str(self.name)
    
    @classmethod
    def create(cls, ship_id, name):
        ship = cls()
        ship.ship_id = ship_id
        ship.name    = name
        ship.save()
        return ship
    
    @classmethod
    def get_by_id(cls, ship_id):
        try:
            return cls.objects.get(ship_id=ship_id)
        except:
            return None
            
    @classmethod
    def get_by_player(cls, game, player):
        try:
            return cls.objects.get(game=game, player=player)
        except:
            return None
            
    @classmethod
    def get_list(cls, game, exclude=None):
        ret = []
        ships = cls.objects.filter(game=game).exclude(ship_id=exclude)
        for ship in ships:
            ret.append({'data': ship.ship_id, 'value': ship.name})            
        return ret
        
        
            
    def set_player(self, player):
        self.player = player
        self.save()
        return self
        
    def join_game(self, game):
        self.game = game
        self.save()
        return self
        
    def exit_game(self):
        self.game = None
        self.save()
        return self


class GameAbiEvent(models.Model):
    name = models.CharField(max_length=128)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    notif_trigger    = models.BooleanField(default=False)
    join_trigger     = models.BooleanField(default=False)
    exit_trigger     = models.BooleanField(default=False)
    discord          = models.BooleanField(default=False)
    discord_template = models.TextField(blank=True)
        
    def __str__(self):
        return self.name

    @classmethod
    def create(cls, name, game):
        ae = cls()
        ae.name = name
        ae.game = game
        ae.save()
        return ae
    
    @staticmethod
    def delete_game(cls, game):
        cls.objects.filter(game=game).delete()
    
    @classmethod
    def get(cls, game, name):
        try:
            return cls.objects.get(game=game, name=name)
        except:
            return None
        
        

class GameAbiFunction(models.Model):
    name   = models.CharField(max_length=128)
    hash   = models.CharField(max_length=10)
    game   = models.ForeignKey(Game, on_delete=models.CASCADE)
    events = models.ManyToManyField(GameAbiEvent, blank=True)
    
    def __str__(self):
        return self.name

    @classmethod
    def create(cls, name, hash, game):
        af = cls()
        af.name = name
        af.hash = hash
        af.game = game
        af.save()
        return af
        
    @classmethod
    def get_by_hash(cls, hash, game):
        try:
            return cls.objects.get(hash=hash, game=game)
        except:
            return None

    @classmethod
    def get_by_name(cls, name, game):
        try:
            return cls.objects.get(name=name, game=game)
        except:
            return None
            
    @classmethod
    def delete_game(cls, game):
        cls.objects.filter(game=game).delete()

        
class DiscordEvent(models.Model):
    STATUS = (('P', 'Pending'),
              ('S', 'Success'),
              ('E', 'Error'))

    game     = models.ForeignKey(Game, on_delete=models.CASCADE)
    message  = models.TextField()
    status   = models.CharField(max_length=1, choices=STATUS, default='P')
    error    = models.CharField(max_length=128, blank=True)
    
    def __str__(self):
        return "%s_%s" % (self.id, self.game.name)
        
    @classmethod    
    def create(cls, game, message):
        de = cls()
        de.game    = game
        de.message = "{\"content\":\"%s\"}" % message
        de.save()
        return de
        
    @classmethod
    def get_pending_queue(cls, game):
        return cls.objects.filter(game=game, status='P').order_by('-id')
        
        
class Ranking(models.Model):
    ship   = models.ForeignKey(Ship, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)
    game   = models.ForeignKey(Game, on_delete=models.CASCADE)
    
    def __str__(self):
        return str(self.id)

    @classmethod
    def list(cls, game, user=None):
        rankings = cls.objects.filter(game=game).order_by('-points')

        ret = []
        pp  = 0
        i = 1
        for r in rankings: 
            r.position = i
            i = i + 1
            if r.ship.player is None:
                r.owner = False
            elif user == r.ship.player.user:
                pp = r.position
                r.owner = True
            else:
                r.owner = False
            ret.append(r)
        
        return ret, pp
        
    @classmethod
    def create(cls, ship, game):
        r = cls()
        r.ship = ship
        r.game = game
        r.save()
        return r
    
    @classmethod
    def get(cls, ship, game):
        try:
            return cls.objects.get(ship=ship, game=game)
        except:
            return None
    
    @classmethod
    def get_by_player(cls, game, player):
        ship = Ship.get_by_player(game, player)
        if ship is not None:
            ranking = cls.objects.get(ship=ship)
    
    def update(self, points):
        self.points = points
        self.save()
        return self
     
        
#class Battles

