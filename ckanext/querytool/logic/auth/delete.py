import logging
log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''
        Authorization check for querytool delete
    '''
    # sysadmins only
    return {'success': False}