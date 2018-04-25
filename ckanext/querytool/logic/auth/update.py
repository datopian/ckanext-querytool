import logging

log = logging.getLogger(__name__)


def querytool_update(context, data_dict):
    '''
        Authorization check for updating querytool
    '''
    # sysadmins only
    return {'success': False}


def querytool_edit(context, data_dict):
    '''
        Authorization check for updating visualizations
    '''
    # sysadmins only
    return {'success': False}
