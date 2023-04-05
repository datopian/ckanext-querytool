# encoding: utf-8

import logging
import requests

import ckanext.querytool.helpers as ckanext_helpers

log = logging.getLogger(__name__)

def check_recaptcha(request):
    '''Check a user\'s recaptcha submission is valid, and raise CaptchaError
    on failure.'''
    recaptcha_config = ckanext_helpers.get_recaptcha_config()

    secretkey = recaptcha_config.get('secretkey')

    client_ip_address = request.environ.get(
        'REMOTE_ADDR', 'Unknown IP Address')

    # reCAPTCHA v2
    recaptcha_response_field = request.params.get('g-recaptcha-response', '')
    recaptcha_server_name = 'https://www.google.com/recaptcha/api/siteverify'

    # recaptcha_response_field will be unicode if there are foreign chars in
    # the user input. So we need to encode it as utf8 before urlencoding or
    # we get an exception (#1431).
    params = {
        "secret": secretkey,
        "remoteip": client_ip_address,
        "response": recaptcha_response_field.encode('utf8')
    }

    response = requests.get(recaptcha_server_name, params, verify=False)
    data = response.json()
    
    return data["success"]
