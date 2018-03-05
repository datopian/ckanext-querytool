# encoding: utf-8
import logging
import json
from operator import itemgetter

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
from ckan.plugins import toolkit
import ckan.lib.helpers as h
import ckanext.querytool.helpers as helpers


log = logging.getLogger(__name__)

render = base.render
abort = base.abort

NotFound = logic.NotFound
NotAuthorized = logic.NotAuthorized
ValidationError = logic.ValidationError
check_access = logic.check_access
get_action = logic.get_action
tuplize_dict = logic.tuplize_dict
clean_dict = logic.clean_dict
parse_params = logic.parse_params


def _get_context():
    context = {'model': model,
               'session': model.Session,
               'user': c.user,
               'for_view': True,
               'with_private': False}

    return context


def _get_action(action, data_dict):
    return toolkit.get_action(action)(_get_context(), data_dict)


class QueryToolController(base.BaseController):

    ctrl = 'ckanext.querytool.controllers.querytool:QueryToolController'

    def list(self):
        '''

        :return: query list template
        '''

        context = _get_context()

        try:
            check_access('querytool_list', context)

            querytools = _get_action('querytool_list', {})
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_list.html',
                      extra_vars={
                          'data': querytools})

    def show(self):
        '''

        :return: query list template
        '''
        context = _get_context()

        try:
            check_access('querytool_show', context)
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_show.html',
                      extra_vars={
                          'msg': 'This is the Query Tool'})

    def delete(self, querytool):
        '''
            Delete query tool

        :return: querytools list template page

        '''

        context = _get_context()

        try:
            check_access('querytool_delete', context)
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        id = querytool[1:]

        try:
            junk = _get_action('querytool_delete', {'id': id})
        except NotFound:
            abort(404, _('Querytool not found'))

        h.flash_success(_('Querytool and visualizations were '
                          'removed successfully.'))
        toolkit.redirect_to(h.url_for('querytool_list'))

    def querytool_edit(self, querytool=None, data=None,
                       errors=None, error_summary=None):
        '''
            Create/edit query tool

        :return: query create/edit template page

        '''
        context = _get_context()
        try:
            check_access('querytool_update', context)
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        if querytool:
            querytool = querytool[1:]

        data_dict = {
            'name': querytool
        }
        _querytool = _get_action('querytool_get', data_dict)

        if _querytool is None and len(querytool) > 0:
            abort(404, _('Querytool not found.'))

        if _querytool is None:
            _querytool = {}

        if toolkit.request.method == 'POST' and not data:
            data = dict(toolkit.request.POST)
            print data.keys()
            filters = []
            y_axis_columns = []
            for k, v in data.items():

                if k.startswith('data_filter_name_'):
                    filter = {}
                    id = k.split('_')[-1]
                    filter['order'] = int(id)
                    filter['name'] = data['data_filter_name_{}'.format(id)]
                    filter['value'] = data['data_filter_value_{}'.format(id)]
                    filter['alias'] = data['data_filter_alias_{}'.format(id)]
                    filter['visibility'] = \
                        data['data_filter_visibility_{}'.format(id)]

                    filters.append(filter)
                elif k.startswith('y_axis_column_'):
                    y_axis_columns.append(v)

            if any(filters):
                _querytool['filters'] = json.dumps(filters)
                sql_string = helpers.create_query_str(data['resource_id_1'],
                                                      filters)
            else:
                _querytool['filters'] = ''
                sql_string = ''

            _querytool.update(data)
            _querytool['querytool'] = querytool
            _querytool['sql_string'] = sql_string
            _querytool['y_axis_columns'] = ','.join(y_axis_columns)

            try:
                junk = _get_action('querytool_update', _querytool)
                h.flash_success(_('Data Successfully updated.'))
            except ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                return self.querytool_edit('/' + querytool, _querytool,
                                           errors, error_summary)
            if 'save_data' in data.keys():
                # redirect to querytools
                url = h.url_for('querytool_list')
            else:
                # redirect to manage visualisations
                url = h.url_for('querytool_edit_visualizations',
                                querytool='/' + _querytool['name'])
            h.redirect_to(url)

        if not data:
            data = _querytool

        if 'filters' in data and len(data['filters']) > 0:
            data['filters'] = json.loads(data['filters'])
            data['filters'].sort(key=itemgetter('order'))

        if 'chart_resource' in data:
            try:
                resource = _get_action('resource_show',
                                       {'id': data['chart_resource']})
                resource_fields = _get_action('get_resource_fields',
                                              {'resource': resource})
                c.active_filters = ','.join(resource_fields)
                c.resource_id = resource['id']
            except NotFound:
                abort(404, _('Package not found'))

        errors = errors or {}
        error_summary = error_summary or {}

        if _querytool.get('y_axis_columns'):
            _querytool['y_axis_columns'] =\
                _querytool.get('y_axis_columns').split(',')

        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary,
                'querytool': _querytool}

        return render('querytool/admin/base_edit_data.html',
                      extra_vars=vars)

    def edit_visualizations(self, querytool=None, data=None,
                            errors=None, error_summary=None):
        '''
            Create or edit visualizations for the querytool

        :return: query edit template page
        '''
        if querytool:
            querytool = querytool[1:]

        data_dict = {
            'name': querytool
        }
        _visualization_items = \
            _get_action('querytool_get_visualizations', data_dict)

        _querytool = _get_action('querytool_get', data_dict)

        if _querytool is None and len(querytool) > 0:
            abort(404, _('Querytool not found.'))

        if _visualization_items is None:
            _visualization_items = {
                'name': querytool
            }

        if toolkit.request.method == 'POST' and not data:
            data = dict(toolkit.request.POST)
            visualizations = []
            for k, v in data.items():

                if k.startswith('chart_field_graph_'):
                    visualization = {}
                    id = k.split('_')[-1]
                    visualization['order'] = int(id)
                    visualization['graph'] = \
                        data['chart_field_graph_{}'.format(id)]
                    visualization['x_axis'] = \
                        data['chart_field_axis_x_{}'.format(id)]
                    visualization['y_axis'] = \
                        data['chart_field_axis_y_{}'.format(id)]
                    visualization['color'] = \
                        data['chart_field_color_{}'.format(id)]
                    visualization['title'] = \
                        data['chart_field_title_{}'.format(id)]
                    visualization['x_text_rotate'] = \
                        data['chart_field_x_text_rotate_{}'.format(id)]
                    visualization['tooltip_name'] = \
                        data['chart_field_tooltip_name_{}'.format(id)]
                    visualization['data_format'] = \
                        data['chart_field_data_format_{}'.format(id)]
                    visualization['y_tick_format'] = \
                        data['chart_field_y_ticks_format_{}'.format(id)]
                    visualization['padding_bottom'] = \
                        data['chart_field_padding_bottom_{}'.format(id)]
                    visualization['padding_top'] = \
                        data['chart_field_padding_top_{}'.format(id)]
                    visualization['y_label'] = \
                        data['chart_field_y_label_{}'.format(id)]
                    visualization['size'] = \
                        data['chart_field_size_{}'.format(id)]
                    if 'chart_field_legend_{}'.format(id) in data:
                        visualization['show_legend'] = 'true'
                    else:
                        visualization['show_legend'] = 'false'
                    if 'chart_field_labels_{}'.format(id) in data:
                        visualization['show_labels'] = 'true'
                    else:
                        visualization['show_labels'] = 'false'

                    visualizations.append(visualization)

            if any(visualizations):
                _visualization_items['charts'] = json.dumps(visualizations)
            else:
                _visualization_items['charts'] = ''

            try:
                junk = _get_action('querytool_visualizations_update',
                                   _visualization_items)
                h.flash_success(_('Visualizations Successfully updated.'))
            except ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                return self.querytool_edit('/' + querytool, data,
                                           errors, error_summary)
            # redirect to querytool
            url = h.url_for('querytool_list')
            h.redirect_to(url)

        if not data:
            data = _visualization_items

        if 'charts' in data and len(data['charts']) > 0:
            data['charts'] = json.loads(data['charts'])
            data['charts'].sort(key=itemgetter('order'))

        errors = errors or {}
        error_summary = error_summary or {}

        data['sql_string'] = _querytool.get('sql_string')
        data['map_resource'] = _querytool.get('map_resource')
        data['chart_resource'] = _querytool.get('chart_resource')
        data['y_axis_columns'] = _querytool.get('y_axis_columns')

        data['y_axis_columns'] = data['y_axis_columns'].split(',')

        data['y_axis_columns'] = map(lambda column: {
            'value': column,
            'text': column
        }, data['y_axis_columns'])

        data['y_axis_columns'].insert(0, {
            'value': '$none$', 'text': '-- Select column --'
        })

        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary}

        return render('querytool/admin/base_edit_visualizations.html',
                      extra_vars=vars)

    def querytool_public(self):
        '''
        Choose between query or story tool
        :return: base template
        '''
        return render('querytool/public/base_main.html',
                      extra_vars={'msg': 'Query or story tool'})

    def querytool_public_list(self):
        '''
        List all of the available query tools
        :return: querytool list template page
        '''
        querytools = _get_action('querytool_public_list', {})

        return render('querytool/public/list.html',
                      extra_vars={'data': querytools})

    def querytool_public_read(self, name):
        '''
        :return: base template
        '''
        querytool = _get_action('querytool_public_read', {'name': name})

        if not querytool or not querytool['charts']:
            abort(404, _('Querytool not fully set.'))

        if querytool.get('charts'):
            querytool['charts'] = json.loads(querytool['charts'])

        params = toolkit.request.params

        new_filters = querytool.get('filters')
        new_filters = json.loads(new_filters)

        for k, v in params.items():
            if k.startswith('data_filter_name_'):
                id = k.split('_')[-1]
                for filter in new_filters:
                    if v == filter.get('name'):
                        filter['value'] =\
                            params.get('data_filter_value_{}'.format(id))
            if k.startswith('y_axis_column'):
                querytool['y_axis_column'] = v

        sql_string = helpers.create_query_str(
            querytool.get('chart_resource'), new_filters
        )

        querytool['public_filters'] = new_filters
        querytool['public_filters'].sort(key=itemgetter('order'))
        querytool['sql_string'] = sql_string

        return render('querytool/public/read.html',
                      extra_vars={'querytool': querytool})
