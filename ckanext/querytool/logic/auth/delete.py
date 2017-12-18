import logging

from ckan.plugins import toolkit as toolkit
import ckanext.querytool.helpers as helpers

log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''
        Authorization check for querytool delete
    '''
    # sysadmins only
    return {'success': False}
