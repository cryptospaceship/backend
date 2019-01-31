#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# Django
#++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.core.exceptions import *


########## Models #############
from .models import Player
from .models import EventInbox
from .models import Transaction
from .models import Message
from .models import Ship
from .models import Game

from json import dumps
from json import loads

http_POST_OK              = 201
http_REQUEST_OK           = 200
http_NOT_FOUND            = 404
http_BAD_REQUEST          = 400
http_UNAUTHORIZED         = 401
http_FORBIDDEN            = 403
http_SERVER_ERROR         = 500

# Create your views here.

@require_http_methods(['GET'])
def api_ship_in_game(request, ship_id, game_id):
    ret = {}
    ret['in_game'] = Ship.is_in_game(ship_id, game_id)
    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)

@require_http_methods(['GET'])
def api_user_exist_address(request, address):
    ret    = {}
    player = Player.get_by_address(address)
    if player:
        ret['user'] = True
    else:
        ret['user'] = False

    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)


@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_events_unread_count(request, game_id):
    player   = Player.get_by_user(request.user)
    game     = Game.get_by_id(game_id)
    ship     = player.get_ship_in_game(game)
    events   = EventInbox.unread_count(game_id, ship)
    return HttpResponse(dumps(events), content_type="application/json", status=http_REQUEST_OK)


@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_event(request, event_id):
    ei = EventInbox.get_by_id(event_id)
    if ei is None:
        body = {'status': 'error', 'message': 'invalid event id'}
        return HttpResponse(dumps(body), content_type="application/json", status=http_BAD_REQUEST)

    player = Player.get_by_user(request.user)
    ship   = player.get_ship_in_game(ei.game)  
    
    if ship == ei.ship:
        ret = {}
        meta = ei.event.load_meta()
        ret['meta'] = meta
        ret['from'] = Ship.get_by_id(meta['_from']).name
        if '_to' in meta:
            if type(meta['_to']).__name__ == 'list':
                ret['to'] = {}
                for ship_id in meta['_to']:
                    if ship_id != 0:
                        ship_name = Ship.get_by_id(ship_id).name
                        ret['to'][ship_id] = ship_name
                    else:
                        ret['to'][ship_id] = ''
            else:
                ret['to']   = Ship.get_by_id(meta['_to']).name
        ret['event_type'] = ei.event.event_type
        status = http_REQUEST_OK
    else:
        body = {'status': 'error', 'message': 'permission denied'}
        status = http_FORBIDDEN

    return HttpResponse(dumps(ret), content_type="application/json", status=status)

@require_http_methods(['GET'])
@login_required(login_url='/signin/')    
def api_get_events_since(request, game_id, event_id):
    player = Player.get_by_user(request.user)
    game   = Game.get_by_id(game_id)
    ship   = player.get_ship_in_game(game)    
    events = EventInbox.get_since_id(ship, event_id, True)
    return HttpResponse(dumps(events), content_type="application/json", status=http_REQUEST_OK)
        
   
@require_http_methods(['POST'])
@csrf_exempt
@login_required(login_url='/signin/')
def api_create_message(request):
    try:
        data = loads(request.body.decode('utf-8'))
    except Exception:
        user_message = "Error sending message. Please try again later."
        message = "error decoding json"
        body = {'status': 'error', 'message': message, "user_message": user_message}
        return HttpResponse(dumps(body), content_type="application/json", status=http_BAD_REQUEST)
    
    game   = Game.get_by_id(data['game_id'])
    player = Player.get_by_user(request.user)
    sender = Ship.get_by_player(game, player)
    receiver = Ship.get_by_id(data['to'])
    if receiver is None:
        user_message = "Error sending message. Please try again later."
        message = "user does not exist"
        body = {'status': 'error', 'message': message, "user_message": user_message}
        return HttpResponse(dumps(body), content_type="application/json", status=http_BAD_REQUEST)
    
    try:    
        Message.create(sender, receiver, data['subject'], data['message'])
    except:
        user_message = "Error sending message. Please try again later."
        message = "error saving data into db"
        body = {'status': 'error', 'message': message, "user_message": user_message}
        return HttpResponse(dumps(body), content_type="application/json", status=http_BAD_REQUEST)
    
    return HttpResponse(status=http_POST_OK)

    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_inbox_unread_count(request, game_id, box):
    if box == 'outbox':
        return HttpResponse(dumps(0), content_type="application/json", status=http_REQUEST_OK)
    player   = Player.get_by_user(request.user)
    game     = Game.get_by_id(game_id)
    ship     = player.get_ship_in_game(game)
    messages = Message.get_inbox_unread_count(ship.ship_id)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)
    
    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_message(request, msg_id):
    msg = Message.get_by_id(msg_id)
    if msg is None:
        body = {'status': 'error', 'message': 'invalid message id'}
        return HttpResponse(dumps(body), content_type="application/json", status=http_BAD_REQUEST)
    
    player = Player.get_by_user(request.user)
    ship   = player.get_ship_in_game(msg.game)
    
    if ship == msg.sender:
        body = msg.serialize()
        status = http_REQUEST_OK
        if ship == msg.receiver and not msg.read:
            msg.mark_as_read()
    elif ship == msg.receiver:
        body = msg.serialize()
        status = http_REQUEST_OK
        if not msg.read:
            msg.mark_as_read()
    else:
        body = {'status': 'error', 'message': 'permission denied'}
        status = http_FORBIDDEN
    print(body)    
    return HttpResponse(dumps(body), content_type="application/json", status=status)

    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_messages(request, game_id, box):
    player   = Player.get_by_user(request.user)
    game     = Game.get_by_id(game_id)
    ship     = player.get_ship_in_game(game)
    if box == "inbox":
        messages = Message.get_inbox_list(ship.ship_id, True)
    else:
        messages = Message.get_outbox_list(ship.ship_id, True)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)

    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')    
def api_get_messages_since(request, game_id, msg_id):
    player   = Player.get_by_user(request.user)
    game     = Game.get_by_id(game_id)
    ship     = player.get_ship_in_game(game)    
    messages = Message.get_inbox_since_id(ship, msg_id, True)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)
    
    