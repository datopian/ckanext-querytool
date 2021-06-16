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
        # check if user has an edit permission for given querytool:
        querytool = CkanextQueryTool.get(name=querytool)
        return {'success': user_in_org_or_group(querytool.owner_org)}
    # if querytool is None then we need to create one:
    # check if user has a edit permission for any org:
    orgs = organizations_available()
    log.error(any([org['capacity'] != 'member' for org in orgs]))
    return {'success': any([org['capacity'] != 'member' for org in orgs])}


def querytool_edit(context, data_dict):
    '''
        Authorization check for updating visualizations
    '''
    querytool = data_dict.get('name')
    if querytool:
        # check if user has an edit permission for given querytool:
        querytool = CkanextQueryTool.get(name=querytool)
        return {'success': user_in_org_or_group(querytool.owner_org)}
    # if querytool is None then we need to create one:
    # check if user has a edit permission for any org:
    orgs = organizations_available()
    return {'success': any([org['capacity'] != 'member' for org in orgs])}
