from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.core.paginator import Paginator

from .decorators import owner_required

from .models import CryptoSpaceShip
from .models import Game
from .models import EventInbox
from .models import GameTemplate
from .models import Var
from .models import Message
from .models import Ranking

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
    elif game.version.name == "1.5":
        context.update(game.connect().view_ship(ship_id))
        context.update(game.connect().view_ship_vars(ship_id))
        context.update(game.connect().view_fleet(ship_id))
        context.update(game.connect().view_building_level(ship_id))
        context.update(game.connect().get_strategic_map(context['position_x'], context['position_y']))
        context.update(game.connect().get_game())
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

def __calc_ranking_page(position, fields_page):
    d = position / fields_page
    r = position % fields_page
    if r > 0:
        d = d + 1
    return int(d)
    
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
        
    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def play_resources_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    template = GameTemplate.get(game.version, 'resources')    
        
    context = {}
    context['explorer_url'] = game.network.explorer
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()
    
    context.update(__get_resources(game, ship_id))

    return render(request, template.file, context)


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
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context.update(__get_map(game, ship_id))
    
    template = GameTemplate.get(game.version, 'map')

    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def play_buildings_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    template = GameTemplate.get(game.version, 'buildings')    
        
    context = {}
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    context['events_count'] = EventInbox.not_read_count(game_id, ship_id)

    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css() 
    
    context.update(__get_buildings(game, ship_id))   

    return render(request, template.file, context)

    
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

    return render(request, template.file, context)

    
@login_required(login_url='/signin/')
@owner_required
def play_ranking_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    page_fields = 10
    
    template  = GameTemplate.get(game.version, 'ranking')    
        
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
    
    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()  
    
    css_ranking, position = Ranking.list(game, request.user)
    
    paginator = Paginator(css_ranking, page_fields)
    page      = request.GET.get('page')
    if page is None:
        page = __calc_ranking_page(position, page_fields)
    rankings  = paginator.get_page(page) 
    
    context['rankings'] = rankings    

    return render(request, template.file, context)

