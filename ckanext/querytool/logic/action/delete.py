import logging
import ckan.logic as logic
from ckanext.querytool.model import CkanextQueryTool

check_access = logic.check_access

log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''Delete querytool.
    :param name: the name of query
    :type name: string
    :rtype: dictionary
    '''
    check_access('querytool_delete', context, data_dict)
    CkanextQueryTool.delete(id=data_dict['name'])
