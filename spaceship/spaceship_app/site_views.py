from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.core.exceptions import *
from django.http import HttpResponse

from .models import Player
from .models import Var
from .models import Network
from .models import CryptoSpaceShip
from .models import Game
from .models import Ship
from .models import SiteTemplate
from .models import Message
from .models import EventInbox

from .decorators import owner_required

from .sign import _ecRecover

import os

from json import loads

#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Response Codes
#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
http_POST_OK              = 201
http_REQUEST_OK           = 200
http_NOT_FOUND            = 404
http_SERVER_ERROR         = 500


@login_required(login_url='/signin/')
def fleet_view(request, net_id):
    if net_id == '':
        return render(request, SiteTemplate.get_file('ships_redirect'))

    player = Player.get_by_user(request.user)
    ship   = CryptoSpaceShip.get_by_net_id(net_id)

    if ship is None:
        return render(request, SiteTemplate.get_file('not_found'))

    ship_list = ship.connect().get_ships_by_owner(player.address)
    ship_price = ship.connect().get_creation_ship_price()
    current_gen = ship.connect().get_current_gen()

    net_name   = Network.get_by_net_id(net_id)

    template = SiteTemplate.get('fleet')
    
    context = {}
    context['inject_js']         = template.get_js()
    context['inject_css']        = template.get_css()
    context['gameNetwork']       = net_id
    context['game_network_name'] = net_name
    context['ship_price']        = ship_price
    context['contract_address']  = ship.address
    context['contract_abi']      = loads(ship.abi)
    context['ship_list']         = ship_list
    context['current_gen']       = current_gen
    colors = {}
    for s in ship_list:
        colors[s['id']] = s['color']
    context['ship_colors'] = colors
        

    if player is not None:
        context['player_address'] = player.address
    
    return render(request, template.file, context)




@login_required(login_url='/signin/')
def signout_view(request):
    logout(request)
    return redirect('/')


#------------------------------------------------------------------
# LogIn
#------------------------------------------------------------------
def signin_view(request):
    if request.user.is_authenticated:
        if request.user.is_staff:
            return redirect('/admin')

        return redirect('/ui/ships/')

    if request.method == 'POST':
        signature = request.POST['sign_signature_input']
        address   = request.POST['sign_address_input']
        net_id    = request.POST['sign_network_input']

        player = Player.get_by_address(address)
        if player:
            addr = _ecRecover(address,signature)
            if addr == address:
                login(request, player.user)
                return redirect('/ui/%s/ships/' % net_id)
        else:
            return redirect('/signup/')
            
    template          = SiteTemplate.get('signin')
    signup            = Var.get_var('signupLocation')
    api_userByAddress = Var.get_var('api_userByAddress')

    context = {}
    context['inject_js']         = template.get_js()
    context['inject_css']        = template.get_css()
    context['signupLocation']    = signup
    context['api_userByAddress'] = api_userByAddress

    return render(request, template.file, context)



def signup_view(request):

    context = {}  

    if request.user.is_authenticated:
        return redirect('/ui/ships/')

    template          = SiteTemplate.get('signup')    
    signin            = Var.get_var('signinLocation')
    api_userByAddress = Var.get_var('api_userByAddress')

    context['inject_js']         = template.get_js()
    context['inject_css']        = template.get_css()
    context['signinLocation']    = signin
    context['api_userByAddress'] = api_userByAddress

    if request.method == 'POST':
        address   = request.POST['sign_address_input']
        username  = request.POST['signup_username_input']
        email     = request.POST['signup_email_input']
        signature = request.POST['sign_signature_input']
        net_id    = request.POST['sign_network_input']

        #
        # Revisamos estemo punto mas adelante
        #
        if address == '' or username == '' or email == '' or signature == '':
            return redirect('/signup/')

        player = Player.get_by_address(address)
        if player:
            return redirect('/signin/')
          
        try:
            User.objects.get(username=username)
            context['message'] = {'status': 'failed', 'message': 'El nombre de usuario ya existe'}
            return render(request, template.file, context)
        except ObjectDoesNotExist:
            pass # El username no existe

    
        try:
            User.objects.get(email=email)
            context['message'] = {'status': 'failed', 'message': 'Ya te has registrado con este correo electronico: %s' % email}
            return render(request, template.file, context)
        except ObjectDoesNotExist:
            pass # El mail no esta registrado

        msg  = '%s:%s' % (email,username)
        addr = _ecRecover(msg,signature)

        if addr == address:
            # Debemos crear el usuario
            user = User.objects.create_user(username,email,signature[:30])
            user.is_active  = True
            user.save()
            player         = Player()
            player.user    = user
            player.address = address
            player.save()
            login(request, user)
            return redirect('/ui/ships/%s' % net_id)

    return render(request, template.file, context)


@login_required(login_url='/signin/')
@owner_required
def ship_view(request, net_id, ship_id):
    ship    = CryptoSpaceShip.get_by_net_id(net_id)

    if ship is None:
        return render(request,html_templates['not_found'])
    
    game_contract_id = ship.connect().get_ship_game(int(ship_id))
    
    context = {}
    if game_contract_id != 0:
        game = Game.get_by_contract_id(game_contract_id, ship.network.net_id)
        context['game']                  = game
        context['contract_address']      = game.address
        context['contract_abi']          = loads(game.abi)
        context['game_block']            = game.deployed_at
    else:
        game_list = Game.objects.filter(network=ship.network, enabled=True)

        games_data = {}
        context['game_list'] = []
        for game in game_list:
            if not game.end():
                context['game_list'].append(game)        
                games_data.update({game.contract_id: {"abi": loads(game.abi), "address": game.address, "id": game.id}})
        context['games_data']   = games_data
    
    template = SiteTemplate.get('ship')
    
    gdata = game.connect().get_game()
    context['game_end']              = gdata['game_end']
    context['is_winner']             = gdata['game_ship_winner'] == ship_id
    context['points_earned']         = game.connect().get_ship_points(ship_id)
    context['reward']                = gdata['game_reward']
    context['ship_contract_address'] = ship.address
    context['ship_contract_abi']     = loads(ship.abi)
    context['ship']                  = ship.connect().get_ship(int(ship_id))
    context['game_network_id']       = net_id
    context['inject_js']             = template.get_js()
    context['inject_css']            = template.get_css()
    context['base_url']              = Var.get_var('base_url')

    if context['ship']['in_game']:
        context['destroyed'] = True if game.connect().view_ship_vars(ship_id)['damage'] >= 100 else False
    else:
        context['destroyed'] = False

    player = Player.get_by_user(request.user)
    if player is not None:
        context['player_address'] = player.address
        
    try:
        context['ship']['unassigned_points'] = ship.connect().get_unassigned_points(int(ship_id))
        context['ship']['qaim']              = ship.connect().get_ship_qaim(int(ship_id))
    except:
        context['ship']['unassigned_points'] = 0
        context['ship']['qaim']              = [0,0,0,0,0,0]
    
    return render(request, template.file, context)


@login_required(login_url='/signin/')
def ui_view(request):
    return render(request, SiteTemplate.get_file('ships_redirect'))
    
def metamask_view(request):
    template = SiteTemplate.get('metamask')
    context = {}
    context['inject_css'] = template.get_css()
    return render(request, template.file, context)

def unlock_metamask_view(request):
    template = SiteTemplate.get('unlock_metamask')
    context = {}
    context['inject_css'] = template.get_css()
    return render(request, template.file, context)
    
def change_network_view(request):
    template = SiteTemplate.get('change_network')
    context = {}
    context['inject_css'] = template.get_css()
    return render(request, template.file, context)

@login_required(login_url='/signin/')
def game_frame_view(request, net_id, game_id, ship_id):
    if not Ship.is_in_game(ship_id, game_id):
        return redirect('/ui/%d/ship/%d/' % (net_id, ship_id))
    
    game = Game.get_by_id(game_id)
    
    if not game.start():
        return redirect('/ui/%d/ship/%d/' % (net_id, ship_id))
        
    template = SiteTemplate.get('game_frame')
    context = {}
    context['game_id']        = game_id
    context['messages_count'] = Message.get_inbox_unread_count(ship_id, game.network)
    context['events_count']   = EventInbox.unread_count(game_id, ship_id)
    context['inject_css']     = template.get_css()
    context['base_url']       = Var.get_var('base_url')
    
    return render(request, template.file, context)
    
def support_view(request):
    template = SiteTemplate.get('support')
    context = {}
    context['inject_css'] = template.get_css()
    context['inject_js'] = template.get_js()
    return render(request, template.file, context)