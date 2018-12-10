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
def api_user_exist_address(request, address):
    ret    = {}
    player = Player.get_by_address(address)
    if player:
        ret['user'] = True
    else:
        ret['user'] = False

    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)


@require_http_methods(['GET'])
def api_events_not_read_count(request, game_id, ship_id):
    ret = {}
    events = EventInbox.not_read_ids(game_id, ship_id)
    ret['result'] = {'count': len(events), 'ids': events}

    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)


@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_event(request, event_id):
    ret = {}
    player = Player.get_by_user(request.user)

    if player is None:
        return HttpResponse(status=http_UNAUTHORIZED)

    ei = EventInbox.get_by_id(event_id)
    if ei is None:
        return HttpResponse(status=http_BAD_REQUEST)

    ship = ei.game.connect().get_ship_by_owner(player.address)
    
    if ship == ei.ship_id:
        ret['result'] = {'meta': ei.event.load_meta()}
        ret['result']['event_type'] = ei.event.event_type
        ei.view()
    else:
        return HttpResponse(status=http_UNAUTHORIZED)

    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)


   
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
    elif ship == msg.receiver:
        body = msg.serialize()
        status = http_REQUEST_OK
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
    messages = Message.get_inbox_since_id(ship.ship_id, msg_id, True)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)
    
    