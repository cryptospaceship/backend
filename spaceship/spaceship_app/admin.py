from django.contrib import admin

# Register your models here.
from .models import Var
from .models import Player
from .models import Gas
from .models import Network
from .models import CryptoSpaceShip
from .models import Game
from .models import Event
from .models import EventInbox
from .models import Order
from .models import Stat
from .models import Action
from .models import Version
from .models import GameTemplate
from .models import GameStatic
from .models import SiteTemplate
from .models import SiteStatic

@admin.register(Var)
class VarAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'dtype']

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['user', 'address', 'last_block']

@admin.register(Gas)
class GasAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Network)
class NetworkAdmin(admin.ModelAdmin):
    list_display = ['name', 'gas', 'net_id', 'proxy']

@admin.register(CryptoSpaceShip)
class CryptoSpaceShipAdmin(admin.ModelAdmin):
    list_display = ['name', 'network', 'address', 'abi']

@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(GameTemplate)
class GameTemplateAdmin(admin.ModelAdmin):
    list_display = ['version', 'view', 'file']
    
@admin.register(GameStatic)
class GameStaticAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'file']

@admin.register(SiteTemplate)
class SiteTemplateAdmin(admin.ModelAdmin):
    list_display = ['view', 'file']
    
@admin.register(SiteStatic)
class SiteStaticAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'file']
    
@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'network', 'address', 'abi']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['game', 'event_type', 'event_block']

@admin.register(EventInbox)
class EventInboxAdmin(admin.ModelAdmin):
    list_display = ['ship_id', 'game', 'event', 'viewed', 'inbox_type', 'creation_date']

@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['game', 'ship_id', 'action', 'tx_hash', 'at_block', 'gas_expended', 'confirmed', 'creation_date']

@admin.register(Stat)
class StatAdmin(admin.ModelAdmin):
    list_display = ['ship_id', 'ship_name', 'game', 'military_points', 'technology_points', 'production_points']