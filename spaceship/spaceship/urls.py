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
from django.conf.urls import url
from django.contrib import admin

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

# GAME VIEWS
from spaceship_app.game_views import play_resources_view
from spaceship_app.game_views import play_map_view
from spaceship_app.game_views import play_buildings_view
from spaceship_app.game_views import play_events_view
from spaceship_app.game_views import play_messages_view

# API VIEWS
from spaceship_app.api_views import api_user_exist_address
from spaceship_app.api_views import api_events_not_read_count
from spaceship_app.api_views import api_get_event
from spaceship_app.api_views import api_create_message
from spaceship_app.api_views import api_get_message
from spaceship_app.api_views import api_get_inbox_messages
from spaceship_app.api_views import api_get_outbox_messages
from spaceship_app.api_views import api_inbox_unread_count

urlpatterns = [
    url(r'^$'                 , home_view),
    url(r'^signin/'           , signin_view),
    url(r'^signup/'	          , signup_view),
    url(r'^signout/'	      , signout_view),
    url(r'^metamask/'	      , metamask_view),
    url(r'^unlock/'	          , unlock_metamask_view),
    url(r'^network/'	      , change_network_view),
    url(r'^ui/ships'          , ui_view),
    url(r'^ui/(?P<net_id>.*)/ships', fleet_view),
    url(r'^ui/(?P<net_id>.+)/ship/(?P<ship_id>.+)/$', ship_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/resources/$', play_resources_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/map/$', play_map_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/buildings/$', play_buildings_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/events/$', play_events_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/messages/$', play_messages_view),
    url(r'^ui/(?P<net_id>.+)/play/(?P<game_id>.+)/(?P<ship_id>.+)/$', game_frame_view),
    url(r'^api/userByAddress/(?P<address>.+)/$', api_user_exist_address),
    url(r'^api/events/(?P<game_id>.+)/(?P<ship_id>.+)/unread/count/$', api_events_not_read_count),
    url(r'^api/events/(?P<event_id>.+)/$', api_get_event),
    url(r'^api/message/add/$', api_create_message),
    url(r'^api/message/get/(?P<msg_id>.+)/$', api_get_message),
    url(r'^api/message/(?P<game_id>.+)/inbox/$', api_get_inbox_messages),
    url(r'^api/message/(?P<game_id>.+)/inbox/count/$', api_inbox_unread_count),
    url(r'^api/message/(?P<game_id>.+)/outbox/$', api_get_outbox_messages),
    url(r'^admin/'            , admin.site.urls),
]
