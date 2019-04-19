# -*- coding: utf-8 -
import re
import logging
import json
import uuid
import urllib
import requests
import functools32

try:
    # CKAN 2.7 and later
    from ckan.common import config
except ImportError:
    # CKAN 2.6 and earlier
    from pylons import config
import ckan.model as m
from ckan.common import c
from ckan.plugins import toolkit
from ckan.plugins.toolkit import _

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


def _isnt_id(v):
    return v['id'] != '_id'


def _is_numeric(v):
    return v['type'] == 'numeric'


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


def get_filter_values(resource_id, filter_name, previous_filters=[]):
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

        sql_string = u'''SELECT DISTINCT "{column}"
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
        {'text': _('Line'), 'value': 'line'},
        {'text': _('Bar'), 'value': 'bar'},
        {'text': _('Horizontal bar'), 'value': 'hbar'},
        {'text': _('Stacked bar'), 'value': 'sbar'},
        {'text': _('Stacked horizontal bar'), 'value': 'shbar'},
        {'text': _('Area'), 'value': 'area'},
        {'text': _('Spline'), 'value': 'spline'},
        {'text': _('Donut'), 'value': 'donut'},
        {'text': _('Pie'), 'value': 'pie'},
        {'text': _('Scatter'), 'value': 'scatter'}
    ]
    return chart_types


def get_color_scheme():
    '''
    Get color schemes for displaying the charts
    :return:
    '''
    colors = [{'value': '#59a14f',
               'text': _('Green')},
              {'value': '#4e79a7',
               'text': _('Blue')},
              {'value': '#499894',
               'text': _('Teal')},
              {'value': '#b6992d',
               'text': _('Golden')},
              {'value': '#ffa600',
               'text': _('Yellow')},
              {'value': '#d87c26',
               'text': _('Orange')},
              {'value': '#9d7660',
               'text': _('Brown')},
              {'value': '#78549a',
               'text': _('Purple')},
              {'value': '#b2182b',
               'text': _('Red')}
              ]

    return colors


def get_map_color_scheme():
    '''
    Get color schemes for displaying the maps
    :return:
    '''
    colors = [
        {
            'value': '#feedde,#fdbe85,#fd8d3c,#e6550d,#a63603',
            'text': _('Sequential reds')
        },
        {
            'value': '#7b3294,#c2a5cf,#EFD9CE,#a6dba0,#008837',
            'text': _('Green-Purple')
        },
        {
            'value': '#d7191c,#fdae61,#ffffbf,#abdda4,#2b83ba',
            'text': _('Blue-Red')
        },
        {
            'value': '#a6611a,#dfc27d,#FCD0A1,#80cdc1,#018571',
            'text': _('Teal-Brown')
        },
        {
            'value': '#e66101,#fdb863,#EFD9CE,#b2abd2,#5e3c99',
            'text': _('Purple-Orange')
        }
    ]

    return colors


def get_tick_text_rotation():
    '''
       Get available options for rotating chart x axis
       :return:
    '''
    options = [{'text': _('Horizontal'), 'value': '0'},
               {'text': _('Diagonal'), 'value': '30'},
               {'text': _('Vertical'), 'value': '90'},
               {'text': _('Reverse'), 'value': '180'}]

    return options


def get_charts_data_formats(num=None):
    '''
        Get available formats for charts tooltip and axis ticks
    :return:
    '''
    options = [{'text': _('Default'), 'value': ''},
               {'text': _('Integer e.g 2'), 'value': '.0f'},
               {'text': _('Decimal (1 digit) e.g 2.5'), 'value': '.1f'},
               {'text': _('Decimal (2 digit) e.g 2.50'), 'value': '.2f'},
               {'text': _('Decimal (3 digit) e.g 2.501'), 'value': '.3f'},
               {'text': _('Decimal (4 digit) e.g 2.5012'), 'value': '.4f'},
               {'text': _('Currency e.g. $2,000'), 'value': '$'},
               {'text': _('Rounded e.g 2k'), 'value': 's'},
               {'text': _('Percentage (0 digit) e.g 25% for 0.25'),
                   'value': '.0%'},
               {'text': _('Percentage (1 digit) e.g 25.1% for 0.251'),
                   'value': '.1%'},
               {'text': _('Percentage (2 digit) e.g 25.12% for 0.2512'),
                   'value': '.2%'},
               {'text': _('Comma thousands separator (0 digit) e.g 2,512'),
                   'value': ',.0f'},
               {'text': _('Comma thousands separator (1 digit) e.g 2,512.3'),
                   'value': ',.1f'},
               {'text': _('Comma thousands separator (2 digit) e.g 2,512.34'),
                   'value': ',.2f'}]
    if num:
        return options[:num]
    return options


def hex_to_rgba(value, alpha):
    value = value.lstrip('#')
    if len(value) == 3:
        value = ''.join([v*2 for v in list(value)])
    return tuple(int(value[i:i+2], 16) for i in range(0, 6, 2))+(alpha,)


def get_visualization_size():
    '''
    Get available sizes for displaying visualizations: charts, text box
    :return:
    '''
    options = [{'text': _('Small Rectangle (1x2)'), 'value': 'size-sm'},
               {'text': _('Small Wide Rectangle (1x6)'),
                   'value': 'size-sm wide'},
               {'text': _('Medium Square (2x2)'), 'value': 'size-sm square'},
               {'text': _('Medium Rectangle (2x3)'), 'value': 'size-lg'},
               {'text': _('Large Rectangle (2x4)'),
                   'value': 'size-sm double square'},
               {'text': _('Extra Large Rectangle (2x6)'), 'value': 'size-xl'},
               {'text': _('Large Square (4x4)'), 'value': 'size-lg square'},
               {'text': _('Medium Vertical (4x2)'),
                   'value': 'size-sm vertical'},
               {'text': _('Large Vertical (4x3)'),
                   'value': 'size-lg vertical'}]
    return options


def _create_where_clause(filters):

    where_clause = u''

    if any(filters):
        if len(filters) > 1:
            # Loop through filters and create SQL query
            for idx, _ in enumerate(filters):
                op = u'='
                name = _['name']
                value = _['value']

                if idx == 0:
                    where_clause = u'WHERE ("{0}" {1} \'{2}\')'.format(
                        name, op, value)
                else:
                    where_clause += u' AND ("{0}" {1} \'{2}\')'.format(
                        name, op, value)

        else:
            _ = filters[0]
            op = u'='
            name = _['name']
            value = _['value']
            where_clause = \
                u'WHERE ("{0}" {1} \'{2}\')'.format(
                    name,
                    op,
                    value
                )
    return where_clause


def create_query_str(resource_id, filters):

    columns = map(lambda f: u'"{0}"'.format(f['name']), filters)
    select = ', '.join(columns)
    where_clause = _create_where_clause(filters)

    # generate the final SQL query string
    sql_string = u'''SELECT * FROM "{resource}" {where}'''.format(
        select=select,
        resource=resource_id,
        where=where_clause)

    return sql_string


def get_dataset_resources(dataset_name):
    '''
    Get resources for particular dataset
    :param dataset_name: Name of the dataset
    :return:
    '''
    dataset_resources = []

    if dataset_name:

        try:
            dataset = _get_action('package_show', {'id': dataset_name})
        except Exception:
            return dataset_resources

        for res in dataset.get('resources'):
            if res['format'].lower() != 'geojson':
                dataset_resources.append({
                    'value': res.get('id'), 'text': res.get('name')
                })

    return dataset_resources


def get_resource_columns(res_id, escape_columns=[]):
    '''

    Get the names of the columns for the resource stored in Datastore

        - res_id: (string) ID of the CKAN resource
        - escape_columns: (array) names of the columns that should be omitted

    '''
    data = {
        'resource_id': res_id,
        'limit': 0
    }

    try:
        result = toolkit.get_action('datastore_search')({}, data)
    except Exception:
        return []

    fields = [field['id'] for field in result.get('fields', [])
              if field['id'] not in escape_columns and _isnt_id(field)]

    return fields


def get_numeric_resource_columns(res_id):
    '''

    Get the names of the columns from numeric type
     for the resource stored in Datastore

        - res_id: (string) ID of the CKAN resource

    '''
    data = {
        'resource_id': res_id,
        'limit': 0
    }

    try:
        result = toolkit.get_action('datastore_search')({}, data)
    except Exception:
        return []

    fields = [field['id'] for field in result.get('fields', [])
              if field['id'] and _isnt_id(field) and _is_numeric(field)]

    return fields


def get_uuid():
    return uuid.uuid4()


def get_geojson_resources():
    data = {
        'query': 'format:geojson',
        'order_by': 'name',
    }
    result = _get_action('resource_search', data)
    return [{'text': r['name'], 'value': r['url']}
            for r in result.get('results', [])]


def get_geojson_properties(url):
    # TODO handle if no url
    resp = requests.get(url)
    geojson = resp.json()

    result = []
    exclude_keys = [
        'marker-symbol',
        'marker-color',
        'marker-size',
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'fill',
        'fill-opacity'
    ]

    for k, v in geojson.get('features')[0].get('properties').iteritems():
        if k not in exclude_keys:
            result.append({'value': k, 'text': k})
    return result


def get_map_data(geojson_url, map_key_field, data_key_field,
                 data_value_field, from_where_clause):

    geojson_keys = []
    # response = urllib.urlopen(geojson_url)
    resp = requests.get(geojson_url)
    # geojson_data = json.loads(response.read())
    geojson_data = resp.json()

    for feature in geojson_data['features']:
        geojson_keys.append(feature['properties'][map_key_field])

    sql = u'SELECT ' + u'"' + data_key_field + \
          u'", SUM("' + data_value_field + u'") as ' + \
          u'"' + data_value_field + u'"' + from_where_clause + \
          u' GROUP BY "' + data_key_field + u'"'

    response = toolkit.get_action('datastore_search_sql')(
        {}, {'sql': sql}
    )
    records_to_lower = []
    for record in response['records']:
        records_to_lower.append({k.lower(): v for k, v in record.items()})
    response['records'] = records_to_lower

    mapping = {}

    for record in records_to_lower:

        key = record[data_key_field.lower()]
        value = record[data_value_field.lower()]

        # Make sure key is number when geojson keys are number:
        try:
            if isinstance(geojson_keys[0], (int, float)) and key.isdigit():
                try:
                    key = int(key)
                except ValueError:
                    key = float(key)
        except Exception, e:
            log.error(e)

        if key not in geojson_keys:
            continue

        mapping[key] = {
            'key': key,
            'value': value
        }

    map_data = {
        'geojson_data': geojson_data,
        'features_values': mapping
    }

    return map_data


@functools32.lru_cache(maxsize=128)
def get_resource_data(sql_string):

    response = toolkit.get_action('datastore_search_sql')(
        {}, {'sql': sql_string}
    )
    records_to_lower = []
    for record in response['records']:
        records_to_lower.append({k.lower(): v for k, v in record.items()})

    return records_to_lower


def get_chart_sort():
    '''
    Get available values for sorting charts data
    :return:
    '''
    options = [{'text': _('Default'), 'value': 'default'},
               {'text': _('Ascending'), 'value': 'asc'},
               {'text': _('Descending'), 'value': 'desc'}]
    return options


def get_groups():
    '''
    Get avaiable groups from config
    :return: list of groups without duplicate
    '''
    ugroup = dict()
    groups = config.\
        get('ckanext.querytool.groups', 'Not set').split(',')
    ugroups = set(groups)
    for group in ugroups:
        val = group.split(':')
        ugroup.update({val[0]: val[1].decode('utf-8')})
    return ugroup


def get_map_config():

    map_config = {
        'osm_url': config.get('ckanext.querytool.map_osm_url',
                              'https://cartodb-basemaps-{s}.global.ssl'
                              '.fastly.net/'
                              'light_nolabels/{z}/{x}/{y}{r}.png'),
        'osm_attribute': config.get('ckanext.querytool.map_osm_attribute',
                                    '&copy; <a href='
                                    '"http://www.openstreetmap.org/'
                                    'copyright">OpenStreetMap</a> &copy; '
                                    '<a href="http://cartodb.com/'
                                    'attributions">CartoDB</a>')
    }
    return json.dumps(map_config)


def get_public_breadcrumb_name():

    return config.get('ckanext.querytool.public_breadcrumb_name',
                      'Health Topics').decode('utf-8')


def allow_nav_bar():
    '''
    Get config var to enable or disable navigation bar on public query page
    :return: True or False
    '''
    isAllowed = config.get('ckanext.querytool.allow_nav_bar', default=True)
    return isAllowed


def parse_y_axis_columns(value):
    # The input string can be:
    # - falsy (None/empty/etc)
    # - modern (as JSON of list of {name,alias})
    # - legacy (as a comma separated string of column names)

    # Falsy
    if not value:
        return []

    # Modern
    try:
        columns = json.loads(value)
        if not isinstance(columns, list):
            raise TypeError()
        return columns

    # Legacy
    except Exception:
        names = value.split(',')
        columns = map(lambda name: {'name': name, 'alias': ''}, names)
        return columns


def pick_first_by_attr_value(items, attr, value, default=False):
    for item in items:
        if item.get(attr) == value:
            return item
    return default


def slugify(string):
    string = string or ''
    return re.sub(r'\W+', '_', string, flags=re.UNICODE).strip('_').lower()


def parse_json(string):
    return json.loads(string)


def dump_json(value):
    return json.dumps(value)


def get_dataset_url_path(url):
    # Remove http://host:port/lang part
    parts = url.split('/dataset')
    if len(parts) == 1:
        return ''
    return '/dataset%s' % parts[1]
