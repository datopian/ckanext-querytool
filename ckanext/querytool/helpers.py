# -*- coding: utf-8 -
try:
    # CKAN 2.7 and later
    from ckan.common import config
except ImportError:
    # CKAN 2.6 and earlier
    from pylons import config
import logging
import ckan.model as m
from ckan.common import c
from ckan.plugins import toolkit
import json

log = logging.getLogger(__name__)


def _get_context():
    return {
        'model': m,
        'session': m.Session,
        'user': c.user or c.author,
        'auth_user_obj': c.userobj
    }


def _get_action(action, data_dict):
    return toolkit.get_action(action)(_get_context(), data_dict)


def _get_functions(module_root, functions={}):
    '''
     Helper function that scans extension
     logic/auth dir for all logic/auth functions.
     '''
    for module_name in ['create', 'update', 'delete', 'get']:
        module_path = '%s.%s' % (module_root, module_name,)

        module = __import__(module_path)

        for part in module_path.split('.')[1:]:
            module = getattr(module, part)

        for key, value in module.__dict__.items():
            if not key.startswith('_') \
                    and (hasattr(value, '__call__')
                         and (value.__module__ == module_path)):
                functions[key] = value

    return functions


def user_is_registered(context):
    '''
        Checks if the user is registered user
    '''
    model = context['model']
    user = context['user']
    user_obj = model.User.get(user)
    if not user_obj:
        log.error('User {0} not found').format(user)
        return False

    return True


def get_all_datasets():
    '''
    Get all public datasets
    :return:
    '''
    datasets = _get_action('package_list', {})

    return datasets


def get_filter_values(resource_id, filter_name, previous_filters):
    '''Returns resource field values with no duplicates.'''

    resource = _get_action('resource_show', {'id': resource_id})

    if not resource.get('datastore_active'):
        return []

    data = {
        'resource_id': resource['id'],
        'limit': 0
    }
    result = _get_action('datastore_search', data)

    where_clause = _create_where_clause(previous_filters)

    fields = [field['id'] for field in result.get('fields', [])]
    values = []

    if filter_name in fields:

        sql_string = '''SELECT DISTINCT "{column}"
         FROM "{resource}" {where}'''.format(
            column=filter_name,
            resource=resource_id,
            where=where_clause
        )

        result = _get_action('datastore_search_sql', {'sql': sql_string})
        values = [field[filter_name] for field in result.get('records', [])]

    return sorted(values)


def get_chart_types():
    '''
    Get all available types of chart following c3 specification
    :return:
    '''
    chart_types = [
        {'text': 'Line', 'value': 'line'},
        {'text': 'Bar', 'value': 'bar'},
        {'text': 'Horizontal bar', 'value': 'hbar'},
        {'text': 'Stacked bar', 'value': 'sbar'},
        {'text': 'Stacked horizontal bar', 'value': 'shbar'},
        {'text': 'Area', 'value': 'area'},
        {'text': 'Stacked area', 'value': 'area-spline'},
        {'text': 'Spline', 'value': 'spline'},
        {'text': 'Donut', 'value': 'donut'},
        {'text': 'Pie', 'value': 'pie'},
        {'text': 'Scatter', 'value': 'scatter'},
        {'text': 'Bubble', 'value': 'bscatter'}
    ]
    return chart_types


def get_color_scheme():
    '''
    Get color schemes for displaying the charts
    :return:
    '''
    colors = [{'value': '#B80000, #995522, #556677, #118888, #115588, '
              '#4C3D3D, #2B2B2B, #660000, #221100',
               'text': 'Saturated'},
              {'value': '#DDBBAA, #79E6F2, #88AA99, #00A864, #228899, '
                        '#3F797F, #775555, #118855, #008751, #3D4C46',
               'text': 'Light'},
              {'value': '#ADC0D8, #79AFF2, #8899AA, #0EAAB2, #00A0A8, '
                        '#776655, #118888, #885511, #3F5C7F, #225599',
               'text': 'Pastel'},
              {'value': '#ADB1D8, #8899AA, #7983F2, #777752, #887711, '
                        '#0070C0, #0062A8, #3F457F, #115588, #3D464C',
               'text': 'Pastel 2'},
              {'value': '#AA9988, #A88600, #779922, #6C7F3F, #887711, '
                        '#555577, #665500, #665100, #4C493D, #2B2B2V',
               'text': 'Contrast'},
              {'value': '#b9fff2, #6cdeff, #00a3d3, #00778d, #006351, '
                        '#b9fff5, #6cdeff, #01a3d3, #02778d, #006389',
               'text': 'Ocean'},
              {'value': '#6EF752, #75F070, #8ADBC2, #85E0AD, #80E699, '
                        '#7DE88F, #7AEB85,  #70F55C, #6BFA47, #66FF33',
               'text': 'Limes'},
              {'value': '#2f1313, #451611, #60191c, #6f1a31, #890a3e, '
                        '#BD4587, #CC4C80,  #DB5478, #EB5C70, #FF6666',
               'text': 'Dark cherry'},
              {'value': '#eba7ff, #ff7878, #e057ff, #de47ff, #890a3e, '
                        '#B866FF, #8F66FF,  #5C66FF, #5266FF, #3366FF',
               'text': 'Purple'},
              {'value': '#1f2439, #e4f714, #114ee8, #e4e4e4, #000000, '
                        '#cc885b, #321108,  #6c3b2c, #94b0a4, #d6b5a4',
               'text': 'Urban'},
              {'value': '#ff3366, #00ff99, #33cccc, #ffff66, #993399, '
                        '#f3c6f2, #efa6b6,  #bd98e0, #8d90e2, #7554ae',
               'text': 'Candy'},
              {'value': '#22758e, #b63b3b, #f9c414, #e3e8e6, #4c4555, '
                        '#d53c3c, #80add3,  #97cfcc, #e4b03d, #c39de0',
               'text': 'Orient'},
              {'value': '#3b5998, #8b9dc3, #dfe3ee, #f7f7f7, #ffffff, ',
               'text': 'Facebook'},
              {'value': '#ffb3ba, #ffdfba, #ffffba, #baffc9, #bae1ff, ',
               'text': 'Rainbow'},
              {'value': '#2e4045, #83adb5, #c7bbc9, #5e3c58, #bfb5b2, ',
               'text': 'Muted'}
              ]

    return colors


def get_tick_text_rotation():
    '''
       Get available options for rotating chart x axis
       :return:
    '''
    options = [{'text': 'Horizontal', 'value': '0'},
               {'text': 'Right', 'value': '30'},
               {'text': 'Vertical', 'value': '90'},
               {'text': 'Left', 'value': '-30'},
               {'text': 'Reverse', 'value': '180'}]

    return options


def get_charts_data_formats():
    '''
        Get available formats for charts tooltip and axis ticks
    :return:
    '''
    options = [{'text': 'Dolar e.g 2000$', 'value': '$'},
               {'text': 'Rounded e.g 2k', 'value': 's'},
               {'text': 'Percentage (multiply by 100) e.g 200000%',
                'value': 'p'},
               {'text': 'Binary e.g 11111010000', 'value': 'b'},
               {'text': 'Comma (thousands separator) e.g 2,000', 'value': ','},
               {'text': 'Binary e.g 11111010000', 'value': 'b'},
               {'text': 'Integer e.g 2', 'value': '.0f'},
               {'text': 'Decimal (1 digit) e.g 2.5', 'value': '.1f'},
               {'text': 'Decimal (2 digit) e.g 2.50', 'value': '.2f'},
               {'text': 'Decimal (3 digit) e.g 2.501', 'value': '.3f'},
               {'text': 'Decimal (4 digit) e.g 2.5012', 'value': '.4f'}]
    return options


def _create_where_clause(filters):

    where_clause = ''

    if any(filters):
        if len(filters) > 1:
            # Loop through filters and create SQL query
            for idx, _ in enumerate(filters):
                op = '='
                name = _['name'].encode('utf-8')
                value = _['value']

                if idx == 0:
                    where_clause = 'WHERE ("{0}" {1} \'{2}\')'.format(
                        name, op, value.encode('utf-8'))
                else:
                    where_clause += ' AND ("{0}" {1} \'{2}\')'.format(
                        name, op, value.encode('utf-8'))

        else:
            _ = filters[0]
            op = '='
            name = _['name'].encode('utf-8')
            value = _['value']
            where_clause = \
                'WHERE ("{0}" {1} \'{2}\')'.format(
                    name,
                    op,
                    value.encode('utf-8')
                )
    return where_clause


def create_query_str(resource_id, filters):

    columns = map(lambda f: '"{0}"'.format(f['name'].encode('utf-8')), filters)
    select = ', '.join(columns)
    where_clause = _create_where_clause(filters)

    # generate the final SQL query string
    sql_string = '''SELECT * FROM "{resource}" {where}'''.format(
        select=select,
        resource=resource_id,
        where=where_clause)

    return sql_string


def get_avaiable_filters(name):

    data_dict = {
        'name': name
    }
    _querytool = _get_action('querytool_get', data_dict)

    filters = json.loads(_querytool['filters'])
    axis_filters = []
    for filter in filters:
        axis_filters.append(filter['name'])

    return axis_filters


def get_dataset_resources(dataset_name):
    dataset_resources = []

    if dataset_name:
        dataset = _get_action('package_show', {'id': dataset_name})

        for res in dataset.get('resources'):
            dataset_resources.append({
                'value': res.get('id'), 'text': res.get('name')
            })

    return dataset_resources


def get_resource_columns(res_id):
    '''

    Get the names of the columns for the resource stored in Datastore

        - res_id: (string) ID of the CKAN resource

    '''

    try:
        res_info = _get_action('datastore_info', {'id': res_id})
    except Exception:
        return []

    fields = res_info.get('schema').keys()

    return fields
