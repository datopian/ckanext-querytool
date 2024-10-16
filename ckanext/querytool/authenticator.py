import logging
from repoze.who.interfaces import IAuthenticator
from webob.request import Request
from zope.interface import implements

from ckan.lib.authenticator import UsernamePasswordAuthenticator

from ckanext.querytool.model import VitalsSecurityTOTP

log = logging.getLogger(__name__)


class VitalsTOTPAuth(UsernamePasswordAuthenticator):
    implements(IAuthenticator)

    def authenticate(self, environ, identity):
        try:
            user_name = identity['login']
        except KeyError:
            return None

        if not ('login' in identity and 'password' in identity):
            return None

        # Run through the CKAN auth sequence first, so we can hit the DB
        # in every case and make timing attacks a little more difficult.
        auth_user_name = super(VitalsTOTPAuth, self).authenticate(
            environ, identity
        )

        if auth_user_name is None:
            return None

        return self.authenticate_totp(environ, auth_user_name)

    def authenticate_totp(self, environ, auth_user):
        totp_challenger = VitalsSecurityTOTP.get_for_user(auth_user)

        # if there is no totp configured, don't allow auth
        # shouldn't happen, login flow should create a totp_challenger
        if totp_challenger is None:
            log.info("Login attempted without MFA configured for: {}".format(
                auth_user)
            )
            return None

        form_vars = environ.get('webob._parsed_post_vars')
        form_vars = dict(list(form_vars[0].items()))

        if not form_vars.get('mfa'):
            log.info("Could not get MFA credentials from the request")
            return None

        result = totp_challenger.check_code(
            form_vars.get('mfa'),
            totp_challenger.created_at,
            form_vars.get('login')
        )

        if result:
            return auth_user
