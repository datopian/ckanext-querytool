import logging

import ckan.logic as logic
from ckan.plugins import toolkit
from ckanext.querytool.model import CkanextQueryTool, table_dictize,\
                                    CkanextQueryToolVisualizations

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
        querytool = table_dictize(querytool, context)
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
    if querytool:
        querytool = table_dictize(querytool, context)

    return querytool


@toolkit.side_effect_free
def querytool_get_visualizations(context, data_dict):
    '''Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    '''

    # check_access('',
    #            context, data_dict)

    log.info('Querytool visualizations: %r', data_dict)
    name = data_dict['name']
    visualizations = CkanextQueryToolVisualizations.get(name=name)
    if visualizations:
        visualizations = table_dictize(visualizations, context)
    return visualizations


def get_resource_fields(context, data_dict):
    '''Returns sorted list of text and time fields of a datastore resource.'''

    resource = data_dict.pop('resource')

    if not resource.get('datastore_active'):
        return []

    data = {
        'resource_id': resource['id'],
        'limit': 0
    }
    result = logic.get_action('datastore_search')(context, data)

    fields = [field['id'] for field in result.get('fields', [])]

    return sorted(fields)
