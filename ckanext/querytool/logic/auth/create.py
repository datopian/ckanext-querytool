import logging

from ckan.plugins import toolkit as toolkit
import ckanext.querytool.helpers as helpers

log = logging.getLogger(__name__)


def querytool_create(context, data_dict):
    '''
        Authorization check for creating new querytool
    '''
    success = helpers.user_is_sysadmin(context)
    out = {
        'success': success,
        'msg': '' if success else
        toolkit._('User not authorized to create new query')
    }
    return out
