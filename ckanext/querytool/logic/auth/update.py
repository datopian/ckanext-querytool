import logging

from ckanext.querytool.model import CkanextQueryTool
from ckan.lib.helpers import user_in_org_or_group, organizations_available

log = logging.getLogger(__name__)


def querytool_update(context, data_dict):
    '''
        Authorization check for updating querytool or visualizations
    '''
    querytool = data_dict.get('name')
    if querytool:
        # check if user an edit permission for given querytool:
        querytool = CkanextQueryTool.get(name=querytool)
        user_in_org = user_in_org_or_group(querytool.owner_org)
        if user_in_org:
            return {'success': True}
        return {'success': False}
    # if querytool is None then we need to create one:
    # check if user has a read permission for any org:
    orgs = organizations_available('read')
    if len(orgs) == 0:
        return {'success': False}
    return {'success': True}


def querytool_edit(context, data_dict):
    '''
        Authorization check for updating visualizations
    '''
    querytool = data_dict.get('name')
    if querytool:
        # check if user an edit permission for given querytool:
        querytool = CkanextQueryTool.get(name=querytool)
        user_in_org = user_in_org_or_group(querytool.get('owner_org'))
        if user_in_org:
            return {'success': True}
        return {'success': False}
    # if querytool is None then we need to create one:
    # check if user has a read permission for any org:
    orgs = organizations_available('read')
    if len(orgs) == 0:
        return {'success': False}
    return {'success': True}
