from django.core.exceptions import PermissionDenied
from .models import Player
from .models import Game
from .models import CryptoSpaceShip

def __play_owner_required(player, game_id, ship_id):
    game        = Game.get_by_id(game_id)
    player_ship = game.connect().get_ship_by_owner(player.address)

    if int(player_ship) == int(ship_id):
        return True
    else:
        return False


def __ship_owner_required(player, net_id, ship_id):
    space_ship  = CryptoSpaceShip.get_by_net_id(net_id)
    player_ship = space_ship.connect().get_ship(int(ship_id))

    if str(player_ship['owner']).lower() == player.address.lower():
        return True
    else:
        return False


def owner_required(function):
    def wrap(request, *args, **kwargs):
        player = Player.get_by_user(request.user)
        path   = request.path_info.split('/')

        if path[3] == "play":
            has_access = __play_owner_required(player, path[4], path[5])
        elif path[3] == "ship":
            has_access = __ship_owner_required(player, path[2], path[4])

        if has_access:
            return function(request, *args, **kwargs)
        else:
            raise PermissionDenied

    wrap.__doc__ = function.__doc__
    wrap.__name__ = function.__name__
    return wrap