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
import ckan.lib.helpers as h
from ckan import logic

from ckanext.querytool.model import CkanextQueryTool

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


def get_querytool_get_chart_colors(data):
    print data
    print 'in'
    try:
        data = json.loads(data)
    except:
        data = []

    return data

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
               {'text': _('Percentage (0 digit) e.g 25%% for 0.25'),
                   'value': '.0%'},
               {'text': _('Percentage (1 digit) e.g 25.1%% for 0.251'),
                   'value': '.1%'},
               {'text': _('Percentage (2 digit) e.g 25.12%% for 0.2512'),
                   'value': '.2%'},
               {'text': _('Comma thousands separator (0 digit) e.g 2,512'),
                   'value': ',.0f'},
               {'text': _('Comma thousands separator (1 digit) e.g 2,512.3'),
                   'value': ',.1f'},
               {'text': _('Comma thousands separator (2 digit) e.g 2,512.34'),
                   'value': ',.2f'},
               {'text': _('Date DD/MM/YYYY .e.g. 01/01/2014'),
                   'value': '%d/%m/%Y'},
               {'text': _('Date YYYY/MM/DD .e.g. 2014/01/01'),
                   'value': '%Y/%m/%d'},
               {'text': _('Date YYYY/MM .e.g. 2014/01'),
                   'value': '%Y/%m'},
               {'text': _('Date MM/YYYY .e.g. 01/2014'),
                   'value': '%m/%Y'},
               {'text': _('Date DD/MM .e.g. 01/01'),
                   'value': '%d/%m'},
               {'text': _('Date MM/YY .e.g. 01/14'),
                   'value': '%m/%y'},
               {'text': _('Date YYYY .e.g. 2014'),
                   'value': '%Y'},
               {'text': _('Date MMM DD, YYYY .e.g. Jan 01, 2014'),
                   'value': '%b %d, %Y'},
               {'text': _('Date MMM DD .e.g. Jan 01'),
                   'value': '%b %d'}]
    if num:
        return options[:num]
    return options

def get_maps_data_formats():
    options = [{'text': _('Integer e.g 2'), 'value': '.0f'},
               {'text': _('Decimal (1 digit) e.g 2.5'), 'value': '.1f'},
               {'text': _('Decimal (2 digit) e.g 2.50'), 'value': '.2f'},
               {'text': _('Decimal (3 digit) e.g 2.501'), 'value': '.3f'},
               {'text': _('Decimal (4 digit) e.g 2.5012'), 'value': '.4f'},
               {'text': _('Currency e.g. $2,000.00'), 'value': '$,.2f'},
               {'text': _('Rounded e.g 2k'), 'value': '.4s'},
               {'text': _('Percentage (0 digit) e.g 25%%'),
                   'value': '.0%'},
               {'text': _('Percentage (1 digit) e.g 25.1%%'),
                   'value': '.1%'},
               {'text': _('Percentage (2 digit) e.g 25.12%%'),
                   'value': '.2%'},
               {'text': _('Comma thousands separator (0 digit) e.g 2,512'),
                   'value': ',.0f'},
               {'text': _('Comma thousands separator (1 digit) e.g 2,512.3'),
                   'value': ',.1f'},
               {'text': _('Comma thousands separator (2 digit) e.g 2,512.34'),
                   'value': ',.2f'}]
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

                if isinstance(_['value'], basestring):
                    value = _['value'].replace('\'', '\'\'')
                else:
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

            if isinstance(_['value'], basestring):
                value = _['value'].replace('\'', '\'\'')
            else:
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
    resp = requests.get(url, verify=False)
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
    resp = requests.get(geojson_url, verify=False)
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


# @functools32.lru_cache(maxsize=128)
def get_resource_data(sql_string):
    context = {}

    if not c.userobj or get_is_admin_or_editor_of_any_group(c.userobj):
        context['ignore_auth'] = True

    # We need to un-escape the "&" replacement or else charts won't render
    if '\\0026' in sql_string:
        sql_string = sql_string.replace('\\0026', '&')

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
    Get available Groups from the database
    return: list of groups
    '''
    groups = _get_action('group_list', {'all_fields': True})

    return groups


def get_organizations():
    '''
    Get available Organization from the database
    return: list of organizations
    '''
    groups = _get_action('organization_list', {'all_fields': True})

    return groups


def get_group_title(group_name):
    groups = get_groups()
    group_title = None

    for group in groups:
        if group.get('name') == group_name:
            group_title = group.get('title')

    return group_title


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


def get_all_reports(q=None):
    groups = get_groups()
    reports = _get_action('querytool_list_other', {'groups': groups})

    if q:
        querytool_search_results = querytool_search(query_string=q)
        querytool_search_results_names = [
            querytool.name for querytool in querytool_search_results
        ]
        reports = [
            querytool for querytool in reports if
            querytool['name'] in querytool_search_results_names
        ]

    return reports


def get_user_permission(userobj):
    if not userobj:
        return True

    org = _get_action('organization_list_for_user', {'id': userobj.id})
    group = _get_action('group_list_authz', {'id': userobj.id})

    if len(org) == 0 and len(group) == 0:
        return False
    else:
        return True


def get_orgs_for_user(userobj, org):
    if not userobj:
        orgs = get_organizations()
    else:
        orgs = _get_action('organization_list_for_user', {'id': userobj.id})

    org_names = [o['name'] for o in orgs]

    if org in org_names:
        return True
    else:
        return False


def get_all_orgs_for_user(userobj):
    if not userobj:
        orgs = get_organizations()
    else:
        orgs = _get_action('organization_list_for_user', {'id': userobj.id})

    if orgs:
        return orgs


def get_organization(org_id):
    return _get_action('organization_show', {'id': org_id}) if org_id else []


def get_datasets_for_user(userobj, package_name):
    package = _get_action('package_show', {'name_or_id': package_name})
    org_access = None

    if package.get('organization'):
        org_access = get_orgs_for_user(userobj, package['organization']['name'])

    if org_access or (userobj and userobj.sysadmin):
        return True

    for group in package.get('groups'):
        group_access = get_groups_for_user(userobj, group['name'])

        if group_access:
            return True

    return False


def get_groups_for_user(userobj, group=None):
    if not userobj:
        return False

    groups = _get_action('group_list_authz', {'id': userobj.id})
    group_names = [g['name'] for g in groups]

    if group is None:
        return group_names

    if len(groups) != 0 and group in group_names:
        return True
    else:
        return False


def get_is_admin_or_editor_of_any_group(userobj):
    if userobj is None:
        return False

    groups = _get_action('group_list_authz', {'id': userobj.id})

    is_admin_or_editor = [get_user_permission_type(userobj, group['id']) for group in groups]

    if len(groups) != 0 and any(t in ['admin', 'editor'] for t in is_admin_or_editor):
        return True
    else:
        return False


def get_edit_permission_for_user(userobj, group):
    if c.userobj:
        if c.userobj.sysadmin:
            return True

    try:
        member_list = toolkit.get_action('member_list')(
            {}, {'id': group}, permissions_check=True
        )

        if c.userobj.id in member_list:
            return True
        return False
    except logic.NotFound:
        return False


def get_user_permission_type(userobj, group):
    if c.userobj:
        if c.userobj.sysadmin:
            return 'admin'

        try:
            member_list = toolkit.get_action('member_list')(
                {}, {'id': group}, permissions_check=True
            )

            for m in member_list:
                if c.userobj.id in m:
                    if 'admin' in m:
                        return 'admin'
                    if 'member' in m:
                        return 'member'
                    if 'editor' in m:
                        return 'editor'

        except logic.NotFound:
            return


def get_all_org_permissions(userobj):
    orgs = get_all_orgs_for_user(userobj) or []

    permissions = [
        get_user_permission_type(userobj, org.get('id')) for org in orgs]
    return any(p in ['admin', 'editor'] for p in permissions)


def get_querytool_get_chart_colors(data):
    try:
        data = json.loads(data)
    except:
        data = []

    return data


def convert_bar_width(bar_width, convert=True, type='bar'):
    if not bar_width or bar_width == 'None':
        if type == 'donut':
            return 4.0
        else:
            return 5.0

    if convert:
        return str(round(float(bar_width) * 10, 2))
    else:
        return str(round(float(bar_width) / 10, 2))

def get_cookie_control_config():
        cookie_control_config = {}

        enabled = config.get(
            'ckanext.querytool.cc.enabled', 'false').lower()
        enabled = enabled if enabled in ['true', 'false'] else 'false'
        cookie_control_config['enabled'] = enabled

        api_key = config.get(
            'ckanext.querytool.cc.api_key', '')
        cookie_control_config['api_key'] = api_key

        license_type = config.get(
            'ckanext.querytool.cc.license_type', '')
        cookie_control_config['license_type'] = license_type

        popup_position = config.get(
            'ckanext.querytool.cc.popup_position', '')
        cookie_control_config['popup_position'] = popup_position

        theme_color = config.get(
            'ckanext.querytool.cc.theme_color', '')
        cookie_control_config['theme_color'] = theme_color

        initial_state = config.get(
            'ckanext.querytool.cc.initial_state', '')
        cookie_control_config['initial_state'] = initial_state

        text = json.dumps({
            "title": config.get('ckanext.querytool.cc.text.title', ''),
            "intro": config.get('ckanext.querytool.cc.text.intro', ''),
            "accept": config.get('ckanext.querytool.cc.text.accept', ''),
            "reject": config.get('ckanext.querytool.cc.text.reject', ''),
            "on": config.get('ckanext.querytool.cc.text.on', ''),
            "off": config.get('ckanext.querytool.cc.text.off', ''),
            "necessary_title": config.get('ckanext.querytool.cc.text.necessary_title', ''),
            "necessary_description": config.get('ckanext.querytool.cc.text.necessary_description', ''),
            "analytical_title": config.get('ckanext.querytool.cc.text.analytical_title', ''),
            "analytical_description": config.get('ckanext.querytool.cc.text.analytical_description', '')
        })
        cookie_control_config['text'] = text

        return cookie_control_config

def get_social_media_links(social_order, admin_dict):
    social_order = social_order.split(',')

    social_media_links = []

    for sm in social_order:
        try:
            sm_link = getattr(admin_dict, '{}_url'.format(sm))
        except:
            log.warning('Social media link not found for {}'.format(sm))
            continue
        if sm_link:
            social_media_links.append({
                'type': sm,
                'link': sm_link
            })

    return social_media_links

def querytool_search(query_string=None, query_group=None):
    querytool = CkanextQueryTool()
    return list(set(querytool.search(
        query_string=query_string, query_group=query_group
    )))

def report_search_count(reports, remove_private=False):
    if remove_private is False:
        report_count = len(reports)
    else:
        report_count = len([
            r for r in reports if r.get('private') is False
            and r.get('type') == 'main'
        ])

    return report_count

def filter_reports_by_permissions(reports, for_groups=False):
    user = c.userobj

    if user is None:
        return []

    if user:
        if user.sysadmin:
            return reports

    user_groups = get_groups_for_user(user)

    if for_groups is False:
        filtered_reports = [
            report for report in reports if
            report['group'] in user_groups
        ]
    else:
        filtered_reports = [
            report for report in reports if
            report['name'] in user_groups
        ]

    return filtered_reports

def group_count_design_reports(current_c):
    reports = filter_reports_by_permissions(
        current_c.page.items, for_groups=True
    )

    current_c.page.item_count = len(reports)

    return current_c

#   Transform RGB and color name to hex
def color_to_hex(color):
    color = str(color)

    #   Detect RGB
    if(color.startswith('rgb')):
        numbers = re.findall(r'\d+', color)
        r = int(numbers[0])
        g = int(numbers[1])
        b = int(numbers[2])
        
        return ('#{:02X}{:02X}{:02X}').format(r, g, b)

    #   Previously supported colors dict for retrocompatibility
    named_colors = {
        "green": "#008000",
        "blue": "#0000FF",
        "teal": "#008080",
        "goldenrod": "#DAA520",
        "yellow": "#FFFF00",
        "orange": "#FFA500",
        "brown": "#A52A2A",
        "purple": "#800080",
        "red": "#FF0000",
        "burlywood": "#DEB887",
        "coral": "#FF7F50",
        "black": "#000000",
        "darkblue": "#00008B",
        "darkgray": "#A9A9A9",
        "darkolivegreen": "#556B2F",
        "darkseagreen": "#8FBC8B",
        "darkslateblue": "#483D8B",
        "darkturquoise": "#00CED1",
        "deeppink": "#FF1493",
        "deepskyblue": "#00BFFF",
        "lightgreen": "#90EE90",
        "mediumvioletred": "#C71585",
        "midnightblue": "#191970",
        "lightsteelblue": "#B0C4DE",
        "powderblue": "#B0E0E6",
        "lightyellow": "#FFFFE0",
        "teal": "#008080",
        "darkcyan": "#008B8B",
        "cadetblue": "#5F9EA0",
        "mediumaquamarine": "#66CDAA",
        "coral": "#FF7F50",
        "darkorange": "#FF8C00",
        "sandybrown": "#F4A460",
        "navajowhite": "#FFDEAD",
        "peru": "#CD853F",
        "burlywood": "#DEB887",
        "tan": "#D2B48C",
        "wheat": "#F5DEB3",
        "papayawhip": "#FFEFD5"
    }

    if color in named_colors.keys():
        return named_colors.get(color)

    return color