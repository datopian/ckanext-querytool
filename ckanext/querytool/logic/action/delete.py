import logging
import ckan.logic as logic
from ckanext.querytool.model import CkanextQueryTool
from ckan.plugins import toolkit

check_access = logic.check_access

log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''Delete querytool.
    :param id: the id of query
    :type id: string
    :rtype: dictionary
    '''
    check_access('querytool_delete', context)
    id = toolkit.get_or_bust(data_dict, 'id')
    CkanextQueryTool.delete(id=id)