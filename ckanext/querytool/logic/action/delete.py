import logging
from ckanext.querytool.model import CkanextQueryTool

from ckan.plugins import toolkit
log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''Delete querytool.
    :param id: the id of query
    :type id: string
    :rtype: dictionary
    '''
    # logic.check_access('querytool_delete', context, data_dict)

    id = toolkit.get_or_bust(data_dict, 'id')

    CkanextQueryTool.delete(id=id)

    log.info('Querytool delete: %r', data_dict)
    return {
        'message': 'Querytool successfully deleted'
    }
