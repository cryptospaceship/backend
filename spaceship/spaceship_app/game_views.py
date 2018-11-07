from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .decorators import owner_required

from .models import CryptoSpaceShip
from .models import Game
from .models import EventInbox
from .models import GameTemplate
from .models import Var
from .models import Message

from json import loads

#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Response Codes
#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
http_POST_OK              = 201
http_REQUEST_OK           = 200
http_NOT_FOUND            = 404
http_SERVER_ERROR         = 500

def __get_events(game, ship_id):
    context = {}
    if game.version.name == "1.4":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_resource_production(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_game_2())
        context.update(game.connect().get_last_block_number())
        
    return context

def __get_resources(game, ship_id):
    context = {}
    if game.version.name == "1.4":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_resource_production(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_game_2())
        context.update(game.connect().get_last_block_number())
    elif game.version.name == "1.5":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_resource_production(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_game())
        context.update(game.connect().get_last_block_number())
        
    return context

def __get_map(game, ship_id):
    context = {}
    if game.version.name == "1.4":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_fleet(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_strategic_map(context['position_x'], context['position_y']))
        context.update(game.connect().get_game_2())
        context.update(game.connect().get_last_block_number())
    
    return context

def __get_buildings(game, ship_id):
    context = {}
    if game.version.name == "1.4":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_fleet(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().view_resource_production(ship_id))
        context.update(game.connect().get_game_2())
        context.update(game.connect().get_last_block_number())
    elif game.version.name == "1.5":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_fleet(ship_id))
        context.update(game.connect().view_resource_production(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_game())
        context.update(game.connect().get_last_block_number())
        
    return context
    
    
@login_required(login_url='/signin/')
@owner_required
def play_events_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    context = {}
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)
    
    context.update(__get_events(game, ship_id))
    
    context['events'] = []
    for o in EventInbox.get_by_ship_id(ship_id):
        context['events'].append(o)

    template = GameTemplate.get(game.version, 'events')
        
    return render(request, template, context)


@login_required(login_url='/signin/')
@owner_required
def play_resources_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    context = {}
    context['explorer_url'] = game.network.explorer
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context.update(__get_resources(game, ship_id))
    
    template = GameTemplate.get(game.version, 'resources')

    return render(request, template, context)


@login_required(login_url='/signin/')
@owner_required
def play_map_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request,html_templates['not_found'])

    context = {}
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = game.network.net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context.update(__get_map(game, ship_id))
    
    template = GameTemplate.get(game.version, 'map')

    return render(request, template, context)


@login_required(login_url='/signin/')
@owner_required
def play_buildings_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    context = {}
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context.update(__get_buildings(game, ship_id))
    
    template = GameTemplate.get(game.version, 'buildings')

    return render(request, template, context)

    
@login_required(login_url='/signin/')
@owner_required
def play_messages_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    context = {}
    context['base_url']       = Var.get_var('base_url')
    context['game_id']        = game_id
    #context['game_abi']       = loads(game.abi)
    context['game_address']   = game.address
    context['game_network']   = net_id
    context['ship_id']        = ship_id
    context['events_count']   = EventInbox.not_read_count(game_id, ship_id)
    context['messages_count'] = Message.get_inbox_unread_count(ship_id)
    context['inbox_messages'] = Message.get_inbox_list(ship_id, True)
    
    print(context)
    template = GameTemplate.get(game.version, 'messages')

    return render(request, template, context)


