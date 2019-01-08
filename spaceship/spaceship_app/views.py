# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required

from .models import SiteTemplate

def home_view(request):
    if request.user.is_authenticated:
        return redirect('/ui/ships/')

    template = SiteTemplate.get('home')
    context = {}
    context['inject_css'] = template.get_css()
    context['inject_js'] = template.get_js()
    return render(request, template.file, context)