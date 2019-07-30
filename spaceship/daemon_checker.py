import smtplib
import django
import os
os.environ["DJANGO_SETTINGS_MODULE"] = "spaceship.settings"
django.setup()

from spaceship_app.models import Network
from spaceship_app.models import Var

def get_last_block(net):
    try:
        return net.connect().get_last_block_number()
    except:
        return None

def send_email(body):
    gmail_user = Var.get_var('daemon_email_user')
    gmail_password = Var.get_var('daemon_email_pass')
    sent_from = gmail_user  
    to = ['npajoni@cexar.io', 'emiliano.billi@cexar.io']  
    subject = 'Daemon Status'  

    msg = "\r\n".join([
        "From: %s" % sent_from,
        "To: " + ", ".join(to),
        "Subject: Daemon Status",
        "",
        "%s" % body
    ])

    try:  
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.ehlo()
        server.login(gmail_user, gmail_password)
        server.sendmail(sent_from, to, msg)
        server.close()

        print('Email sent!')
    except:  
        print('Something went wrong...')


def main():
    diff = 10
    for network in Network.objects.all():
        lb = get_last_block(network)
        if (lb - network.scanned_block) > diff:
            body = "Last block scanned: %d\nActual block: %d\nCheck daemon status!!!" % (lb, network.scanned_block)
            send_email(body)



main()