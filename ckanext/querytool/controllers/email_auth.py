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
