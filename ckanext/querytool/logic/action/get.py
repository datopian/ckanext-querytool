import logging

import ckan.logic as logic
from ckan.plugins import toolkit
from ckanext.querytool.model import CkanextQueryTool, table_dictize,\
                                    CkanextQueryToolVisualizations
import ckanext.querytool.helpers as h
import ckan.lib.helpers as ch

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


@toolkit.side_effect_free
def querytool_public_read(context, data_dict):
    '''Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    '''

    # check_access('',
    #            context, data_dict)
    session = context['session']
    name = data_dict['name']

    query = session.query(CkanextQueryTool, CkanextQueryToolVisualizations) \
        .join((CkanextQueryToolVisualizations, CkanextQueryTool.id ==
               CkanextQueryToolVisualizations.ckanext_querytool_id)) \
        .filter(CkanextQueryToolVisualizations.name == name)

    result = query.first()
    querytool = {}

    if result and len(result) > 0:
        for item in result:
            querytool.update(table_dictize(item, context))
    return querytool


def get_resource_fields(context, data_dict):
    '''Returns sorted list of text and time fields of a datastore resource.'''

    resource = data_dict.pop('resource')

    return ch.resource_view_get_fields(resource)


def get_filter_values(context, data_dict):

    resource_id = data_dict.pop('resource_id')
    filter_name = data_dict.pop('filter_name')
    previous_filters = data_dict.pop('previous_filters')

    return h.get_filter_values(resource_id, filter_name, previous_filters)


@toolkit.side_effect_free
def querytool_get_resource_data(context, data_dict):
    sql_string = data_dict.get('sql_string')
    response = toolkit.get_action('datastore_search_sql')(
        {}, {'sql': sql_string}
    )
    records_to_lower = []
    for record in response['records']:
        records_to_lower.append({k.lower(): v for k, v in record.items()})

    response['records'] = records_to_lower

    return response
