import logging
import pyotp

import ckan.lib.base as base
import ckan.model as model
import ckan.lib.mailer as mailer
import ckan.logic as logic
from ckan.lib.mailer import mail_user
from ckan.common import _, config
import datetime

from ckanext.querytool.model import VitalsSecurityTOTP

log = logging.getLogger(__name__)

get_action = logic.get_action


class QuerytoolEmailAuthController(base.BaseController):
    def send_2fa_code(self, user):
        try:
            user_dict = get_action('user_show')(None, {'id': user})
            # Get user object instead
            user_obj = model.User.get(user)
            vs_totp = VitalsSecurityTOTP()
            now = datetime.datetime.utcnow()
            challenge = vs_totp.create_for_user(
                user_dict['name'], created_at=now
            )
            secret = challenge.secret
            totp = pyotp.TOTP(secret)
            current_code = totp.at(for_time=now)
            user_display_name = user_dict['display_name']
            user_email = user_dict['email']
            email_subject = _('Verification Code')
            email_body = _(
                'Hi {user},\n\nHere\'s your verification'
                ' code to login: {code}\n\nHave a great day!').format(
                user=user_display_name,
                code=current_code
            )
            site_title = config.get('ckan.site_title')
            site_url = config.get('ckan.site_url')

            email_body += '\n\n' + site_title + '\n' + site_url

            mailer.mail_recipient(
                user_display_name,
                user_email,
                email_subject,
                email_body
            )

            return {'success': True, 'msg': 'Email sent'}
        except Exception as e:
            log.error(e)
            return {'success': False, 'msg': 'Error sending email'}
