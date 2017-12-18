import logging

from ckan.plugins import toolkit as toolkit
import ckanext.querytool.helpers as helpers

log = logging.getLogger(__name__)


def querytool_create(context, data_dict):
    '''
        Authorization check for creating new querytool
    '''
    # sysadmins only
    return {'success': False}
