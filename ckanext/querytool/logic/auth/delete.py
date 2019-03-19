import logging

from ckanext.querytool.model import CkanextQueryTool
from ckan.authz import has_user_permission_for_group_or_org

log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''
        Authorization check for querytool delete
    '''
    # sysadmins only
    # check if user has a delete permission for an org:
    user_has_permission = has_user_permission_for_group_or_org(context.get('user'), 'delete_dataset')
    if not user_has_permission:
        return {'success': False}
    return {'success': True}
