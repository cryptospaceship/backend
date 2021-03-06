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
from .models import Ship
from .models import Transaction

from json import loads
from json import dumps

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

def __calc_page(position, fields_page):
    d = position / fields_page
    r = position % fields_page
    if r > 0:
        d = d + 1
    return int(d)

def __calc_pagination_limits(page, pages_range, total_pages):
    ret = {}
    r = pages_range // 2

    if page is None:
        page = 1
    else:
        page = int(page)

    if page < pages_range:
        ll = 1
        if pages_range > total_pages:
            lr = total_pages
        else:
            lr = pages_range
    elif (page + r) > total_pages:
        diff = page + r - total_pages
        ll = page - r - diff
        lr = total_pages
    elif page < total_pages:
        ll = page - r
        if (page + r) < total_pages:
            lr = page + r
        else:
            lr = total_pages

    if ll > 1:
        ret['ellipsis_left']  = ll
        ll = ll + 1
    if lr < total_pages:
        ret['ellipsis_right'] = lr
        lr = lr - 1

    pages = []
    for i in range(ll, lr + 1):
        pages.append(i)
    ret['range'] = pages

    return ret
    
@login_required(login_url='/signin/')
@owner_required
def play_events_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])
        
    page_fields = 10
    page_range = 5
        
    template = GameTemplate.get(game.version, 'events')

    context = {}
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    #context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    #context['events_count'] = EventInbox.unread_count(game_id, ship_id)
    context['ships_name']    = Ship.get_names(game)
    
    context.update(__get_events(game, ship_id))
    
    events_list = EventInbox.get_by_ship_id(ship_id, game)
    
    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()

    paginator = Paginator(events_list, page_fields)
    page      = request.GET.get('page')
    events    = paginator.get_page(page)
    
    for ei in events:
        ei.title = ei.build_title()
    
    context['events'] = events
    context['events_count'] = events_list.count()
    context['pagination'] = __calc_pagination_limits(page, page_range, events.paginator.num_pages)
    context['pagination_last'] = page_range 
    context['page_fields'] = page_fields
    
    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def play_resources_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    context = {}
    gdata = game.connect().get_game()
    context['game_end']     = gdata['game_end']
    context['is_winner']    = gdata['game_ship_winner'] == ship_id
    context['explorer_url'] = game.network.explorer
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    #context['events_count'] = EventInbox.unread_count(game_id, ship_id)

    context.update(__get_resources(game, ship_id))
    if context['damage'] >= 100 or context['game_end']:
        template = GameTemplate.get(game.version, 'end')
    else:
        template = GameTemplate.get(game.version, 'resources')

    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()
    context['transactions']   = Transaction.get_pending_by_ship(game, ship_id, 'RE', 'list')
    context['refresh_interval'] = game.network.refresh_interval
    context['transaction_group'] = 'RE'
    
    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def play_map_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request,html_templates['not_found'])

    context = {}
    gdata = game.connect().get_game()
    context['game_end']     = gdata['game_end']
    context['is_winner']    = gdata['game_ship_winner'] == ship_id
    context['explorer_url'] = game.network.explorer
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    #context['events_count'] = EventInbox.unread_count(game_id, ship_id)

    context.update(__get_map(game, ship_id))
    
    if context['damage'] >= 100 or context['game_end']:
        template = GameTemplate.get(game.version, 'end')
    else:
        template = GameTemplate.get(game.version, 'map')

    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()
    context['transactions']   = Transaction.get_pending_by_ship(game, ship_id, 'MA', 'list')
    context['refresh_interval'] = game.network.refresh_interval
    context['transaction_group'] = 'MA'

    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def play_buildings_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])
        
    context = {}
    gdata = game.connect().get_game()
    context['game_end']     = gdata['game_end']
    context['is_winner']    = gdata['game_ship_winner'] == ship_id
    context['explorer_url'] = game.network.explorer
    context['base_url']     = Var.get_var('base_url')
    context['game_id']      = game_id
    context['game_abi']     = loads(game.abi)
    context['game_address'] = game.address
    context['game_network'] = net_id
    context['ship_id']      = ship_id
    #context['events_count'] = EventInbox.unread_count(game_id, ship_id)
    
    context.update(__get_buildings(game, ship_id))   
    if context['damage'] >= 100 or context['game_end']:
        template = GameTemplate.get(game.version, 'end')
    else:
        template = GameTemplate.get(game.version, 'buildings')

    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()
    context['transactions']   = Transaction.get_pending_by_ship(game, ship_id, 'BU', 'list')
    context['refresh_interval'] = game.network.refresh_interval
    context['transaction_group'] = 'BU'

    return render(request, template.file, context)

    
@login_required(login_url='/signin/')
@owner_required
def play_messages_view(request, net_id, game_id, ship_id, box=''):
    game = Game.get_by_id(game_id)    
    if game is None:
        return render(request, html_templates['not_foud'])

    page_fields = 10
    page_range  = 5    
        
    template = GameTemplate.get(game.version, 'messages')    
        
    context = {}
    context['base_url']       = Var.get_var('base_url')
    context['game_id']        = game_id
    context['game_address']   = game.address
    context['game_network']   = net_id
    context['ship_id']        = ship_id
    #context['events_count']   = EventInbox.unread_count(game_id, ship_id)
    context['messages_count'] = Message.get_inbox_unread_count(ship_id, game.network)

    if "to" in request.GET:
        context['to_ship'] = request.GET['to']
    
    if box == "inbox" or box == "":
        context["message_type"] = "inbox"
        messages_list = Message.get_inbox_list(ship_id, game.network)
    elif box == "outbox":
        context["message_type"] = "outbox"
        messages_list = Message.get_outbox_list(ship_id, game.network)
        
    context['ship_list'] = dumps(Ship.get_list(game, ship_id))
    
    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()
    
    paginator = Paginator(messages_list, page_fields)
    page      = request.GET.get('page')
    messages  = paginator.get_page(page)
    
    context['messages'] = messages
    context['messages_count'] = messages_list.count()
    context['pagination'] = __calc_pagination_limits(page, page_range, messages.paginator.num_pages)
    context['pagination_last'] = page_range 
    context['page_fields'] = page_fields
    
    return render(request, template.file, context)

    
@login_required(login_url='/signin/')
@owner_required
def play_ranking_view(request, net_id, game_id, ship_id):
    game = Game.get_by_id(game_id)
    if game is None:
        return render(request, html_templates['not_foud'])

    page_fields = 10
    page_range  = 5
    
    template  = GameTemplate.get(game.version, 'ranking')    
        
    context = {}
    context['base_url']       = Var.get_var('base_url')
    context['game_id']        = game_id
    #context['game_abi']       = loads(game.abi)
    context['game_address']   = game.address
    context['game_network']   = net_id
    context['ship_id']        = ship_id
    #context['events_count']   = EventInbox.unread_count(game_id, ship_id)
    context['messages_count'] = Message.get_inbox_unread_count(ship_id, game.network)
    context['inbox_messages'] = Message.get_inbox_list(ship_id, game.network, True)
    
    context['inject_js']      = template.get_js()
    context['inject_css']     = template.get_css()  
    
    css_ranking, position = Ranking.list(game, request.user)
    
    paginator = Paginator(css_ranking, page_fields)
    page      = request.GET.get('page')
    if page is None:
        page = __calc_page(position, page_fields)
    rankings  = paginator.get_page(page) 
    
    context['rankings'] = rankings    
    context['pagination'] = __calc_pagination_limits(page, page_range, rankings.paginator.num_pages)
    

    return render(request, template.file, context)

