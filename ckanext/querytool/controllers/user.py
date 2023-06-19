# encoding: utf-8
import logging
import requests
import ckan.plugins as p
from paste.deploy.converters import asbool
import ckan.lib.base as base
import ckan.logic as logic
from ckan.controllers.user import UserController
from ckan.common import _, c, request, response, config
import ckan.lib.helpers as h
import ckanext.querytool.helpers as querytool_helpers
from ckanext.querytool.lib.recaptcha import check_recaptcha


log = logging.getLogger(__name__)

get_action = logic.get_action
render = base.render
abort = base.abort
MFA_ENABLED = asbool(config.get('ckanext.querytool.2fa_enabled', False))


class QuerytoolUserController(UserController):
    def login(self, error=None):
        if request.method == 'POST':
            if check_recaptcha(request):
                base_url = config.get('ckan.site_url')
                came_from = request.params.get('came_from')

                # Full login URL
                url = base_url + h.url_for(
                    self._get_repoze_handler('login_handler_path'),
                    came_from=came_from)

                username = request.params.get('login')
                password = request.params.get('password')

                # Login form data
                data = { 'login': username, 'password': password }

                if MFA_ENABLED:
                    mfa = request.params.get('mfa')
                    data['mfa'] = mfa

                # Login request headers
                headers = { 'Content-Type': 'application/x-www-form-urlencoded' }

                r = requests.post(url, data=data, headers=headers, verify=False)

                # The login route already does a redirect,
                # so we have to pick the first response
                response_before_redirect = r.history[0]

                # If auth was successful...
                if 'Set-Cookie' in response_before_redirect.headers:
                    # Get the first cookie
                    set_cookie = response_before_redirect.headers['Set-Cookie'].split(',')[0]

                    # Setup the new redirect and cookie  
                    response.status_int = 302
                    response.headerlist = [
                        ('Location', '/dashboard'), 
                        ('Set-Cookie', set_cookie)
                    ]

                    return response
                else:
                    if MFA_ENABLED:
                        error = _('Login failed. Bad username, password, or authentication code.')
                    else:
                        error = _('Login failed. Bad username or password.')

            else:
                error = _('reCAPTCHA validation failed')


        # Do any plugin login stuff
        for item in p.PluginImplementations(p.IAuthenticator):
            item.login()

        if 'error' in request.params:
            h.flash_error(request.params['error'])

        if not c.user:
            came_from = request.params.get('came_from')
            if not came_from:
                came_from = h.url_for(controller='user', action='logged_in')

            recaptcha_config = querytool_helpers.get_recaptcha_config()
            recaptcha_enabled = recaptcha_config.get('enabled', False)

            if recaptcha_enabled:
                c.login_handler = h.url_for(
                    '/user/login',
                    came_from=came_from)
            else:
                c.login_handler = h.url_for(
                self._get_repoze_handler('login_handler_path'),
                came_from=came_from)

            if error:
                vars = {'error_summary': {'': error}}
            else:
                vars = {}
            return render('user/login.html', extra_vars=vars)
        else:
            return render('user/logout_first.html')

    def logged_in(self):
        # redirect if needed
        came_from = request.params.get('came_from', '')
        if h.url_is_local(came_from):
            return h.redirect_to(str(came_from))

        if c.user:
            context = None
            data_dict = {'id': c.user}

            user_dict = get_action('user_show')(context, data_dict)

            return self.me()
        else:
            if MFA_ENABLED:
                err = _('Login failed. Bad username, password, or authentication code.')
            else:
                err = _('Login failed. Bad username or password.')
            if asbool(config.get('ckan.legacy_templates', 'false')):
                h.flash_error(err)
                h.redirect_to(controller='user',
                              action='login', came_from=came_from)
            else:
                return self.login(error=err)
