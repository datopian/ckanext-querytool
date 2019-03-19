from ckan.lib.helpers import organizations_available


def querytool_list(context, data_dict):
    # check if user has a read permission for any org:
    orgs = organizations_available('read')
    if len(orgs) == 0:
        return {'success': False}
    return {'success': True}


def querytool_show(context, data_dict):
    # check if user has a read permission for any org:
    orgs = organizations_available('read')
    if len(orgs) == 0:
        return {'success': False}
    return {'success': True}
