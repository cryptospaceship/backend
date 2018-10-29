from __future__ import unicode_literals
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ObjectDoesNotExist

import json

#from .crypto_spaceship import spaceShip
#from .crypto_game import game
from .libs import crypto_game_v1_4
from .libs import crypto_game_v1_5

from .libs.crypto_spaceship import spaceShip

from json import loads

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
    msg_from    = models.ForeignKey('Player', on_delete=models.CASCADE)
    subject     = models.CharField(max_length=250)
    message     = models.CharField(max_length=1000)
    read        = models.BooleanField()

    
class Player(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE)
    address     = models.CharField(max_length=42)
    last_block  = models.IntegerField(default=0)
    messages    = models.ManyToManyField('Message')

    def __str__(self):
        return '%d_%s' % (self.id,self.address)

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

class JSClient(models.Model):
    view = models.CharField(max_length=250)
    js   = models.CharField(max_length=250)

    def __str__(self):
        return '%s:%s' % (self.view,self.js)

class Transaction(models.Model):
    STATUS = (('S', 'Success'),
              ('E', 'Error'))

    DESCRIPTION = (('M', 'Move'),
                   ('A', 'Attack'))

    player      = models.ForeignKey('Player', on_delete=models.CASCADE)
    tx_hash     = models.CharField(max_length=66)
    status      = models.CharField(max_length=1, choices=STATUS)
    description = models.CharField(max_length=1, choices=DESCRIPTION)


###########################################################################
class Gas(models.Model):
    name = models.CharField(max_length=32)

    def __str__(self):
        return self.name

       
class Network(models.Model):
    name     = models.CharField(max_length=32)
    gas      = models.ForeignKey(Gas, on_delete=models.CASCADE)
    net_id   = models.IntegerField()
    proxy    = models.CharField(max_length=128)
    explorer = models.CharField(max_length=256)

    def __str__(self):
        return self.name

    @classmethod
    def get_by_net_id(cls, net_id):
        try:
            ret = cls.objects.get(net_id=net_id)
        except:
            ret = None
        return ret


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
            ret = cls.objects.get(network=network, enabled=True)
        except:
            ret = None
        return ret

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
    scanned_block       = models.IntegerField(default=0)
    discord_channel_api = models.CharField(max_length=256, blank=True)
    enabled             = models.BooleanField(default=False)

    def __str__(self):
        return self.name

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
            ret = None
        try:
            ret = cls.objects.get(contract_id=contract_id, network=network)
        except:
            ret = None

        print(ret)
        return ret

    def connect(self):
        if self.version.name == "1.4":
            return crypto_game_v1_4.game(self.network.proxy, self.address, self.abi)
        elif self.version.name == "1.5":
            return crypto_game_v1_5.game(self.network.proxy, self.address, self.abi)
        else:
            return None

class GameTemplate(models.Model):
    version = models.ForeignKey(Version, on_delete=models.CASCADE)
    view    = models.CharField(max_length=64)
    file    = models.CharField(max_length=255)    
    
    
    def __str__(self):
        return "%s_%s" %(str(self.version), self.view)
    
    @classmethod
    def get(cls, version, view):
        try:
            return cls.objects.get(version=version, view=view).file
        except:
            return None
            
    def get_js(self):
        ret = []
        gs = GameStatic.objects.filter(game_template=self, file_type='js')
        for js in gs:
            ret.append(js.file)
        return ret

    def get_css(self):
        ret = []
        gs = GameStatic.objects.filter(game_template=self, file_type='css')
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
        ss = SiteStatic.objects.filter(site_template=self, file_type='js')
        for js in ss:
            ret.append(js.file)
        print(ret)
        return ret

    def get_css(self):
        ret = []
        ss = SiteStatic.objects.filter(site_template=self, file_type='css')
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
    
    def __str__(self):
        return str(self.name)
    
    
class Event(models.Model):
    EVENT_TYPES = (('AS', 'Attack Ship'),
                   ('AP', 'Attack Port'),
                   ('PC', 'Port Conquest'),
                   ('FC', 'Fire Cannon'),
                   ('SR', 'Send Resources'))

    game        = models.ForeignKey(Game, on_delete=models.CASCADE)
    event_type  = models.CharField(max_length=2, choices=EVENT_TYPES)
    event_block = models.IntegerField()
    from_ship   = models.IntegerField(blank=True, null=True)
    to_ship     = models.IntegerField(blank=True, null=True)
    event_meta  = models.TextField()

    def __str__(self):
        return str(self.id)

    @classmethod
    def create_attack_ship(cls, order, data):
        event             = cls()
        event.game        = order.game
        event.event_type  = 'AS'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)

    @classmethod
    def create_attack_port(cls, order, data):
        event             = cls()
        event.game        = order.game
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
    def create_port_conquest(cls, order, data):
        event             = cls()
        event.game        = order.game
        event.event_type  = 'PC'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        ships = order.game.connect().get_ships_id()
        for ship in ships:
            if ship != event.from_ship:
                EventInbox.create_to(event, ship)

    @classmethod
    def create_fire_cannon(cls, order, data):
        event             = cls()
        event.game        = order.game
        event.event_type  = 'FC'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)

    @classmethod
    def create_send_resources(cls, order, data):
        event             = cls()
        event.game        = order.game
        event.event_type  = 'SR'
        event.event_block = data[0].blockNumber
        event.from_ship   = dict(data[0].args)['_from']
        event.to_ship     = dict(data[0].args)['_to']
        event.event_meta  = dict(data[0].args)
        event.save()

        EventInbox.create_from(event, data[0].args._from)
        EventInbox.create_to(event, data[0].args._to)


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
    def create_from(cls, event, ship_id):
        event_inbox            = cls()
        event_inbox.game       = event.game
        event_inbox.ship_id    = ship_id
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
            ret = cls.objects.filter(game=game, ship_id=ship_id, viewed=False).count()
        else:
            ret = 0
        return ret

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
            ret = cls.objects.get(id=event_id)
        except:
            ret = None
        return ret

    @classmethod
    def get_by_ship_id(cls, ship_id):
        o = cls.objects.filter(ship_id=ship_id).order_by('-id')
        for i in o:
            print(i.event.event_meta.replace("'", "\""))
            i.event_meta_parsed = loads(i.event.event_meta.replace("'", "\"").replace("False", "false").replace("True", "true"))
            print (i.event_meta_parsed)
        return o

class Action(models.Model):
    name = models.CharField(max_length=32)

    def __str__(self):
        return self.name

    @classmethod
    def get(cls, name):
        try:
            ret = cls.objects.get(name=name)
        except:
            ret = None
        return ret


class Order(models.Model):
    game          = models.ForeignKey(Game, on_delete=models.CASCADE)
    ship_id       = models.IntegerField()
    action        = models.ForeignKey(Action, on_delete=models.CASCADE)
    tx_hash       = models.CharField(max_length=128)
    at_block      = models.IntegerField(blank=True, null=True)
    gas_expended  = models.IntegerField(blank=True, null=True)
    confirmed     = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True, auto_now=False)

    def __str__(self):
        return self.tx_hash

    @classmethod
    def create(cls, data):
        order  = cls()
        game   = Game.get_by_id(data['gameId'])
        action = Action.get(data['orderType'])

        if action is None or game is None:
            return None

        order.game    = game
        order.ship_id = data['shipId']
        order.action  = action
        order.tx_hash = data['txHash']
        order.save()
        return order

    def confirm(self, block, gas):
        self.at_block = block
        self.gas_expended = gas
        self.confirmed = True
        self.save()
        return self


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




#class Ranking

#class Battles

