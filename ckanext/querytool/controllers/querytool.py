# encoding: utf-8
import logging
import json
import cgi
from operator import itemgetter

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
from ckan.plugins import toolkit
import ckan.lib.helpers as h
import ckanext.querytool.helpers as helpers
import ckan.lib.uploader as uploader
from ckan.common import response, request


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
            filters = []
            y_axis_columns = []
            related_querytools = []
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

                elif k.startswith('related_querytool_'):
                    related_querytool = {}
                    id = k.split('_')[-1]
                    related_querytool['order'] = int(id)
                    related_querytool['name'] = \
                        data['related_querytool_{}'.format(id)]
                    related_querytools.append(related_querytool)

            if any(filters):
                _querytool['filters'] = json.dumps(filters)
                sql_string = helpers.create_query_str(data['resource_id_1'],
                                                      filters)
            else:
                _querytool['filters'] = ''
                sql_string = ''

            if 'private' not in data.keys():
                _querytool['private'] = True

            if any(related_querytools):
                _querytool['related_querytools'] = json.\
                    dumps(related_querytools)
            else:
                _querytool['related_querytools'] = ''

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

        if 'related_querytools' in data \
                and len(data['related_querytools']) > 0:
            data['related_querytools'] = json.loads(data['related_querytools'])
            data['related_querytools'].sort(key=itemgetter('order'))

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
            text_boxes = []
            images = []
            for k, v in data.items():

                if k.startswith('chart_field_graph_'):
                    visualization = {}
                    id = k.split('_')[-1]
                    visualization['type'] = 'chart'
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
                    if data['chart_field_filter_name_{}'.format(id)]:
                        visualization['filter_name'] = \
                            data['chart_field_filter_name_{}'.format(id)]
                        visualization['filter_value'] = \
                            data['chart_field_filter_value_{}'.format(id)]
                        visualization['filter_alias'] = \
                            data['chart_field_filter_alias_{}'.format(id)]
                        visualization['filter_visibility'] = \
                            data['chart_field_filter_visibility_{}'.format(id)]
                    else:
                        visualization['filter_name'] = ''
                        visualization['filter_value'] = ''
                        visualization['filter_alias'] = ''
                        visualization['filter_visibility'] = ''

                    visualizations.append(visualization)

                if k.startswith('text_box_description_'):
                    text_box = {}
                    id = k.split('_')[-1]
                    text_box['type'] = 'text_box'
                    text_box['order'] = int(id)
                    text_box['description'] = \
                        data['text_box_description_{}'.format(id)]
                    text_box['size'] = \
                        data['text_box_size_{}'.format(id)]

                    text_boxes.append(text_box)

                if k.startswith('image_field_size_'):
                    image = {}
                    id = k.split('_')[-1]
                    image['type'] = 'image'
                    image['order'] = int(id)

                    image_url =  data['media_image_url_{}'.format(id)]

                    if h.uploads_enabled():
                        image_upload = data['media_image_upload_{}'.format(id)]
                        if isinstance(image_upload, cgi.FieldStorage):
                            upload = uploader.get_uploader('vs', image_url)
                            upload.update_data_dict(data,
                                                    'media_image_url_{}'
                                                    .format(
                                                        id),
                                                    'media_image_upload_{}'
                                                    .format(
                                                        id),
                                                    'False')
                            upload.upload(uploader.get_max_image_size())
                            image_url = upload.filename

                        image['url'] = image_url

                    image['size'] = \
                        data['image_field_size_{}'.format(id)]

                    images.append(image)

            if any(visualizations):
                vis = visualizations + text_boxes + images
                _visualization_items['visualizations'] = json.dumps(vis)
                _visualization_items['y_axis_column'] =\
                    visualizations[0].get('y_axis')

            else:
                _visualization_items['visualizations'] = ''

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

        if 'visualizations' in data and len(data['visualizations']) > 0:
            data['visualizations'] = json.loads(data['visualizations'])
            data['visualizations'].sort(key=itemgetter('order'))

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

        if not querytool or not querytool['visualizations']:
            abort(404, _('Querytool not fully set.'))

        # only sysadmins can access private querytool
        if querytool['private'] is True:
            context = _get_context()
            try:
                check_access('querytool_show', context)
            except NotAuthorized:
                abort(403, _('Not authorized to see this page'))

        params = toolkit.request.params

        querytools = []
        items = []
        items.append({u'order': 0, u'name': querytool['name']})

        if querytool['related_querytools']:
            items.extend(json.loads(querytool['related_querytools']))

        items.sort(key=itemgetter('order'))
        for item in items:

            q_item = _get_action(
                'querytool_public_read',
                {'name': item['name']}
            )
            q_item['visualizations'] = json.loads(
                q_item['visualizations']
            )
            q_item['visualizations'].sort(key=itemgetter('order'))

            q_name = q_item['name']
            new_filters = json.loads(q_item['filters'])

            for k, v in params.items():
                # Update query filters
                if k.startswith('{}_data_filter_name_'.format(q_name)):
                    id = k.split('_')[-1]
                    for filter in new_filters:
                        if v == filter.get('name'):
                            filter['value'] = \
                                params.get('{}_data_filter_value_{}'
                                           .format(q_name, id))
                # Update charts y_axis value
                if k.startswith('{}_y_axis_column'.format(q_name)):
                    q_item['y_axis_column'] = v
                # Update charts filters
                if k.startswith('{}_chart_filter_name'.format(q_name)):
                    id = k.split('_')[-1]
                    for visualization in q_item['visualizations']:
                        if visualization['order'] == int(id):
                            visualization['filter_name'] = \
                                params.get('{}_chart_filter_name_{}'.
                                           format(q_name, id))
                            visualization['filter_value'] = \
                                params.get('{}_chart_filter_value_{}'.
                                           format(q_name, id))

            for image in q_item['visualizations']:
                if image['type'] == 'image':
                    is_upload = image['url'] and not image[
                        'url'].startswith('http')

                    if is_upload:
                        image['url'] = '{0}/uploads/vs/{1}'.format(
                            toolkit.request.host_url, image['url'])


            related_sql_string = helpers.create_query_str(
                q_item.get('chart_resource'),
                new_filters
            )
            q_item['public_filters'] = new_filters
            q_item['public_filters'].sort(key=itemgetter('order'))
            q_item['sql_string'] = related_sql_string

            querytools.append(q_item)

        return render('querytool/public/read.html',
                      extra_vars={'querytools': querytools})

    def querytool_download_data(self, name):
        qs = request.query_string
        file_format = qs.split('=')[1]

        query = _get_action('querytool_get', {'name': name})
        sql_string = query['sql_string']

        data_dict = {
            'sql_string': sql_string,
            'format': file_format
        }

        resp = _get_action('querytool_download_data', data_dict)

        resp_formats = \
            {'csv': 'text/csv',
             'json': 'application/json',
             'xml': 'application/xml',
             'xlsx': 'application/vnd.openxmlformats-officedocument'
                     '.spreadsheetml.sheet'}

        resp_format = resp_formats[file_format]

        file_name = name

        response.headerlist = \
            [('Content-Type', resp_format),
             ('Content-Disposition',
              str('attachment;filename=' + file_name + '.' + file_format))]

        return resp
