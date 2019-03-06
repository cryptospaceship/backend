"""spaceship URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
#from django.conf.urls import url
from django.contrib import admin

from django.urls import path, re_path

from spaceship_app.views import home_view

# SITE VIEWS
from spaceship_app.site_views import signin_view
from spaceship_app.site_views import signup_view
from spaceship_app.site_views import fleet_view
from spaceship_app.site_views import signout_view
from spaceship_app.site_views import ship_view
from spaceship_app.site_views import ui_view
from spaceship_app.site_views import metamask_view
from spaceship_app.site_views import unlock_metamask_view
from spaceship_app.site_views import change_network_view
from spaceship_app.site_views import game_frame_view
from spaceship_app.site_views import support_view

# GAME VIEWS
from spaceship_app.game_views import play_resources_view
from spaceship_app.game_views import play_map_view
from spaceship_app.game_views import play_buildings_view
from spaceship_app.game_views import play_events_view
from spaceship_app.game_views import play_messages_view
from spaceship_app.game_views import play_ranking_view

# API VIEWS
from spaceship_app.api_views import api_user_exist_address
from spaceship_app.api_views import api_events_unread_count
from spaceship_app.api_views import api_get_event
from spaceship_app.api_views import api_get_events_since
from spaceship_app.api_views import api_create_message
from spaceship_app.api_views import api_get_message
from spaceship_app.api_views import api_get_messages
from spaceship_app.api_views import api_inbox_unread_count
from spaceship_app.api_views import api_get_messages_since
from spaceship_app.api_views import api_ship_in_game
from spaceship_app.api_views import api_create_tx
from spaceship_app.api_views import api_get_pending_transactions
from spaceship_app.api_views import api_get_ship_stats


urlpatterns = [
    #url(r'^$'                 , home_view),
    path(''                 , home_view),
    #url(r'^signin/'           , signin_view),
    path('signin/'           , signin_view),
    #url(r'^signup/'	          , signup_view),
    path('signup/'	          , signup_view),
    #url(r'^signout/'	      , signout_view),
    path('signout/'	      , signout_view),
    #url(r'^metamask/'	      , metamask_view),
    path('metamask/'	      , metamask_view),
    #url(r'^faq/'	          , faq_view),
    path('support/'	          , support_view),
    #url(r'^unlock/'	          , unlock_metamask_view),
    path('unlock/'	          , unlock_metamask_view),
    #url(r'^network/'	      , change_network_view),
    path('network/'	          , change_network_view),
    #url(r'^ui/ships'          , ui_view),
    path('ui/ships/'          , ui_view),
    #url(r'^ui/(?P<net_id>.*)/ships', fleet_view),
    re_path(r'^ui/(?P<net_id>.*)/ships', fleet_view),
    #url(r'^ui/(?P<net_id>.+)/ship/(?P<ship_id>.+)/$', ship_view),
    path('ui/<int:net_id>/ship/<int:ship_id>/', ship_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/resources/$', play_resources_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/resources/', play_resources_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/map/$', play_map_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/map/', play_map_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/buildings/$', play_buildings_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/buildings/', play_buildings_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/events/$', play_events_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/events/', play_events_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/messages/(?P<box>.+)/$', play_messages_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/messages/<str:box>/', play_messages_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/ranking/$', play_ranking_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/ranking/', play_ranking_view),
    #url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/$', game_frame_view),
    path('ui/<int:net_id>/play/<int:game_id>/<int:ship_id>/', game_frame_view),
    #url(r'^api/userByAddress/(?P<address>.+)/$', api_user_exist_address),
    path('api/userByAddress/<str:address>/', api_user_exist_address),
    #url(r'^api/events/(?P<game_id>.+)/(?P<ship_id>.+)/unread/count/$', api_events_not_read_count),
    path('api/event/count/<int:game_id>/', api_events_unread_count),
    #url(r'^api/events/(?P<event_id>.+)/$', api_get_event),
    path('api/event/<int:event_id>/', api_get_event),
    path('api/event/since/<int:game_id>/<int:event_id>/', api_get_events_since),
    #url(r'^api/message/new/$', api_create_message),
    path('api/message/new/', api_create_message),
    #url(r'^api/message/get/(?P<msg_id>.+)/$', api_get_message),
    path('api/message/get/<int:msg_id>/', api_get_message),
    path('api/message/since/<int:game_id>/<int:msg_id>/', api_get_messages_since),
    #url(r'^api/message/count/(?P<game_id>.+)/(?P<box>.+)/$', api_inbox_unread_count),
    path('api/message/count/<int:game_id>/<str:box>/', api_inbox_unread_count),
    #url(r'^api/message/list/(?P<game_id>.+)/(?P<box>.+)/$', api_get_messages),
    path('api/message/list/<int:game_id>/<str:box>/', api_get_messages),
    #url(r'^admin/'            , admin.site.urls),
    path('api/ship/ingame/<int:ship_id>/<int:game_id>/', api_ship_in_game),
    path('api/ship/stats/<int:game_id>/', api_get_ship_stats),
    path('api/tx/create/', api_create_tx),
    path('api/tx/get/pending/<int:game_id>/', api_get_pending_transactions),
    path('admin/'            , admin.site.urls),
]
