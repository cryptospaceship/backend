from django.utils.safestring import mark_safe
from django.template import Library

import json


register = Library()


@register.filter(is_safe=True)
def boolean(obj):
    if obj == True:
        return 'true'
    else:
        return 'false'