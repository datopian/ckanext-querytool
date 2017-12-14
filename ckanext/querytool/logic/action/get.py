import logging

from ckan.plugins import toolkit
from ckan.logic import check_access, NotFound
from ckanext.querytool.model import CkanextQueryTool

log = logging.getLogger(__name__)


@toolkit.side_effect_free
def querytool_list(context, data_dict):
    '''Returns a list of all query tools.
    :rtype: list of dictionaries
    '''

    # check_access('',
    #            context, data_dict)

    log.info('Querytool list: %r', data_dict)

    querytools = CkanextQueryTool.search()

    out = []

    for querytool in querytools:
        out.append(querytool)

    return out


@toolkit.side_effect_free
def querytool_get(context, data_dict):
    '''Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    '''

    # check_access('',
    #            context, data_dict)

    log.info('Querytool : %r', data_dict)
    name = data_dict['name']

    querytool = CkanextQueryTool.get(name=name)

    return querytool

