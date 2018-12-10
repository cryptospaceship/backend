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
from .models import Transaction
from .models import Stat
from .models import Action
from .models import Version
from .models import GameTemplate
from .models import GameStatic
from .models import SiteTemplate
from .models import SiteStatic
from .models import Message
from .models import Ship
from .models import GameAbiEvent
from .models import GameAbiFunction
from .models import DiscordEvent
from .models import Ranking

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
    list_display = ['name', 'gas', 'net_id', 'proxy', 'scanned_block']

@admin.register(CryptoSpaceShip)
class CryptoSpaceShipAdmin(admin.ModelAdmin):
    list_display = ['name', 'network', 'address', 'enabled']

@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(GameTemplate)
class GameTemplateAdmin(admin.ModelAdmin):
    list_display = ['version', 'view', 'file']
    
@admin.register(GameStatic)
class GameStaticAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'file', 'order']

@admin.register(SiteTemplate)
class SiteTemplateAdmin(admin.ModelAdmin):
    list_display = ['view', 'file']
    
@admin.register(SiteStatic)
class SiteStaticAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'file']
    
@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'network', 'address', 'enabled']

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['game', 'event_type', 'event_block']

@admin.register(EventInbox)
class EventInboxAdmin(admin.ModelAdmin):
    list_display = ['ship_id', 'game', 'event', 'viewed', 'inbox_type', 'creation_date']

@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['game', 'ship_id', 'action', 'hash', 'at_block', 'gas_expended', 'creation_date']

@admin.register(Stat)
class StatAdmin(admin.ModelAdmin):
    list_display = ['ship_id', 'ship_name', 'game', 'military_points', 'technology_points', 'production_points']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['game', 'sender', 'receiver', 'subject', 'read']

@admin.register(Ship)
class ShipAdmin(admin.ModelAdmin):
    list_display = ['ship_id', 'name', 'game', 'player']
    
@admin.register(GameAbiEvent)
class GameAbiEventAdmin(admin.ModelAdmin):
    list_display = ['name', 'game']

@admin.register(GameAbiFunction)
class GameAbiFunctionAdmin(admin.ModelAdmin):
    list_display = ['name', 'hash', 'game']
    
    def get_object(self, request, object_id, from_field=None):
        # Hook obj for use in formfield_for_manytomany
        self.obj = super(GameAbiFunctionAdmin, self).get_object(request, object_id, from_field)
        return self.obj

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == "events" and getattr(self, 'obj', None):
            kwargs["queryset"] = GameAbiEvent.objects.filter(game=self.obj.game)
        return super(GameAbiFunctionAdmin, self).formfield_for_manytomany(db_field, request, **kwargs)

@admin.register(DiscordEvent)
class DiscordEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'game', 'status']
    
@admin.register(Ranking)
class RankingAdmin(admin.ModelAdmin):
    list_display = ['game', 'ship', 'points']    
        