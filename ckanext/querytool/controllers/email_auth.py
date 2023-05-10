import logging
import pyotp

import ckan.lib.base as base
import ckan.logic as logic
import ckan.lib.mailer
import datetime

from ckanext.querytool.model import VitalsSecurityTOTP

log = logging.getLogger(__name__)

get_action = logic.get_action


class QuerytoolEmailAuthController(base.BaseController):
    def send_2fa_code(self, user):
        try:
            user_dict = get_action('user_show')(None, {'id': user})
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
            email_subject = 'Two-factor Authentication Code'
            email_body = (
                'Hi {},\n\nHere\'s your two-factor authentication'
                ' code to login: {}\n\nHave a great day!').format(
                user_display_name, current_code
            )

            ckan.lib.mailer.mail_recipient(
                user_display_name,
                user_email,
                email_subject,
                email_body
            )

            return {'success': True, 'msg': 'Email sent'}
        except Exception as e:
            log.error(e)
            return {'success': False, 'msg': 'Error sending email'}
