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
    
    sender   = Player.get_by_user(request.user)
    receiver = Player.get_by_username(data['to'])
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
def api_messages_not_read_count(request, game_id, ship_id):
    ret = {}
    events = EventInbox.not_read_ids(game_id, ship_id)
    ret['result'] = {'count': len(events), 'ids': events}

    return HttpResponse(dumps(ret), content_type="application/json", status=http_REQUEST_OK)
    
    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_message(request, msg_id):
    receiver = Player.get_by_user(request.user)
    msg = Message.get_by_id(receiver, msg_id)
    # Consultar quien es el dueño de la nave al contrato.
    if msg is None:
        body = {'status': 'error', 'message': 'permission denied'}
        return HttpResponse(dumps(body), content_type="application/json", status=http_FORBIDDEN)
        
    return HttpResponse(dumps(msg.serialize()), content_type="application/json", status=http_REQUEST_OK)

@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_inbox_messages(request):
    receiver = Player.get_by_user(request.user)
    messages = Message.get_inbox_list(receiver, True)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)
    
@require_http_methods(['GET'])
@login_required(login_url='/signin/')
def api_get_outbox_messages(request):
    sender = Player.get_by_user(request.user)
    messages = Message.get_outbox_list(sender, True)
    return HttpResponse(dumps(messages), content_type="application/json", status=http_REQUEST_OK)