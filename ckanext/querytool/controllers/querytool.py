# encoding: utf-8
import logging
import json
import cgi
import ast
from operator import itemgetter

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
from ckan.plugins import toolkit
import ckan.lib.helpers as h
import ckanext.querytool.helpers as helpers
import ckanext.querytool.model as qmodel
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

    def groups(self):
        '''
        Lists all available groups
        :return: base template
        '''

        context = _get_context()

        try:
            check_access('querytool_list', context)
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_groups.html',
                      extra_vars={'msg': 'Groups'})

    def list_by_group(self, group):
        '''

        :return: query list by group template
        '''

        context = _get_context()

        try:
            check_access('querytool_list', context)

            querytools = _get_action('querytool_list_by_group',
                                     {'group': group})
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_list.html',
                      extra_vars={
                          'data': querytools})

    def list_other(self):
        '''

        :return: list querytools that don't belong to
         any of the existing groups
        '''
        context = _get_context()
        groups = helpers.get_groups()

        try:
            check_access('querytool_list', context)
            querytools = _get_action('querytool_list_other',
                                     {'groups': groups})
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_list.html',
                      extra_vars={
                          'data': querytools})

    def delete(self, querytool):
        '''
            Delete query tool

        :return: querytools list template page

        '''

        context = _get_context()

        name = querytool[1:]

        try:
            check_access('querytool_delete', context, {'name': name})
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        data_dict = {
            'name': name
        }
        _querytool = _get_action('querytool_get', data_dict)

        try:
            junk = _get_action('querytool_delete', {'name': name})
        except NotFound:
            abort(404, _('Report not found'))

        h.flash_success(_('Report and visualizations were '
                          'removed successfully.'))

        toolkit.redirect_to('/group/' + _querytool['group'] + '/reports')

    def querytool_edit(self, querytool=None, data=None,
                       errors=None, error_summary=None):
        '''
            Create/edit query tool

        :return: query create/edit template page

        '''
        if querytool:
            querytool = querytool[1:]

        data_dict = {
            'name': querytool
        }

        context = _get_context()

        _querytool = _get_action('querytool_get', data_dict)
        user_type = helpers.get_user_permission_type(c.userobj, _querytool.get('group')) if _querytool else []

        if not c.userobj or (_querytool and user_type in ['member', None] and c.userobj.sysadmin is False and data_dict.get('name') != ''):
            abort(403, _('Not authorized to see this page'))
        else:
            if user_type not in ['admin', 'editor'] and data_dict.get('name') != '':
                try:
                    check_access('querytool_update', context, data_dict)
                except NotAuthorized:
                    abort(403, _('Not authorized to see this page'))

        if _querytool is None and len(querytool) > 0:
            abort(404, _('Report not found.'))

        if _querytool is None:
            _querytool = {}

        # Check if the data for this querytool still exists
        if 'dataset_name' in list(_querytool.keys()):
            try:
                _get_action('package_show',
                            {'id': _querytool['dataset_name']})
            except NotFound:
                abort(404, _('The data used for creating this '
                             'report has been removed '
                             'by the administrator.'))

        if toolkit.request.method == 'POST' and not data:

            data = dict(toolkit.request.POST)

            group = ast.literal_eval(data['group'])
            data.pop('group')
            data['group'] = group['name']

            filters = []
            y_axis_columns = []
            related_querytools = []
            for k, v in list(data.items()):

                if k.startswith('data_filter_name_'):
                    filter = {}
                    id = k.split('_')[-1]
                    filter['order'] = int(id)
                    filter['name'] = data['data_filter_name_{}'.format(id)]
                    filter['value'] = data['data_filter_value_{}'.format(id)]
                    # Replace & with %26 to fix the error for graphs
                    # not being generated for values with & in them
                    filter['value'] = filter['value'].replace('&','%26')
                    filter['alias'] = data['data_filter_alias_{}'.format(id)]
                    filter['visibility'] = \
                        data['data_filter_visibility_{}'.format(id)]

                    filters.append(filter)
                elif k.startswith('y_axis_name_'):
                    id = k.split('_')[-1]
                    alias = data.get('y_axis_alias_%s' % id, '')
                    y_axis_columns.append({'name': v, 'alias': alias})

                elif k.startswith('related_querytool_'):
                    related_querytool = {}
                    id = k.split('_')[-1]
                    related_querytool['order'] = int(id)
                    related_querytool['name'] = \
                        data['related_querytool_{}'.format(id)]
                    related_querytools.append(related_querytool)

            if any(filters):
                _querytool['filters'] = json.dumps(filters)
                sql_string = helpers.create_query_str(data['chart_resource'],
                                                      filters)
            else:
                _querytool['filters'] = ''
                sql_string = ''

            if 'private' not in list(data.keys()):
                _querytool['private'] = True

            if any(related_querytools):
                _querytool['related_querytools'] = json.\
                    dumps(related_querytools)
            else:
                _querytool['related_querytools'] = ''

            _querytool.update(data)
            _querytool['querytool'] = querytool
            _querytool['sql_string'] = sql_string
            _querytool['y_axis_columns'] = (
                json.dumps(y_axis_columns) if y_axis_columns else '')
            _querytool['owner_org'] = data['owner_org']
            _querytool['icon'] = data['icon']
            _querytool['selection_label'] = data.get('selection_label')
            _querytool['report_caption'] = data.get('report_caption')
            _querytool['download_options'] = data.get('download_options')

            try:
                junk = _get_action('querytool_update', _querytool)
                h.flash_success(_('Data Successfully updated.'))
            except ValidationError as e:
                errors = e.error_dict
                error_summary = e.error_summary
                return self.querytool_edit('/' + querytool, _querytool,
                                           errors, error_summary)
            if 'save_data' in list(data.keys()):
                # redirect to querytools group
                toolkit.redirect_to('/'+h.lang()+'/group/'+_querytool['group']+'/reports')

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
            resource_fields = helpers.\
                get_resource_columns(data['chart_resource'])
            c.active_filters = ','.join(resource_fields)
            c.resource_id = data['chart_resource']

        errors = errors or {}
        error_summary = error_summary or {}

        if _querytool.get('y_axis_columns'):
            _querytool['y_axis_columns'] = helpers.parse_y_axis_columns(
                _querytool.get('y_axis_columns'))
            _querytool['y_axis_names'] = [column['name'] for column in _querytool['y_axis_columns']]

        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary,
                'querytool': _querytool}

        return render('querytool/admin/base_edit_data.html',
                      extra_vars=vars)

    def edit_visualizations(self, querytool=None, data=None,
                            errors=None, error_summary=None,
                            is_copy=False):
        '''
            Create or edit visualizations for the querytool

        :return: query edit template page
        '''
        if querytool:
            querytool = querytool[1:]

        data_dict = {
            'name': querytool
        }

        context = _get_context()

        _querytool = _get_action('querytool_get', data_dict)
        user_type = helpers.get_user_permission_type(c.userobj, _querytool.get('group')) if _querytool else []

        if not c.userobj or (_querytool and user_type in ['member', None] and c.userobj.sysadmin is False):
            abort(403, _('Not authorized to see this page'))
        else:
            if user_type not in ['admin', 'editor']:
                try:
                    check_access('querytool_update', context, data_dict)
                except NotAuthorized:
                    abort(403, _('Not authorized to see this page'))

        if _querytool is None and len(querytool) > 0:
            abort(404, _('Report not found.'))

        # Check if the data for this querytool still exists
        if _querytool['dataset_name']:
            try:
                _get_action('package_show',
                            {'id': _querytool['dataset_name']})
            except NotFound:
                abort(404, _('The data used for creating this '
                             'report has been removed by '
                             'the administrator.'))

        _visualization_items = \
            _get_action('querytool_get_visualizations', data_dict)

        if _visualization_items is None:
            _visualization_items = {
                'name': querytool
            }

        if toolkit.request.method == 'POST' and not data:
            data = dict(toolkit.request.POST)

            is_copy = False
            copy_id = [k for k in list(data.keys()) if k.startswith('copy-viz-btn_')]

            if len(copy_id) == 1:
                is_copy = True
                copy_id = copy_id[0].split('_')[-1]
            else:
                copy_id = None

            new_visualizations = {}
            existing_visualizations = {}

            if copy_id is not None:
                for key, value in list(data.items()):
                    if key == 'save':
                        continue

                    key_list = key.split('_')

                    if any(key.startswith(label) for label in [
                       'chart_field_color_',
                       'chart_field_line_width_',
                       'chart_field_line_type_'
                       ]) and key_list[-1].isdigit() and key_list[-2].isdigit():
                        current_visualization = key_list[-2]

                        if copy_id == current_visualization:
                            new_key_list = list(key_list)
                            new_key_list[-2] = '1'
                            new_visualizations['_'.join(new_key_list)] = value

                        key_list[-2] = str(int(key_list[-2]) + 1)

                    elif key_list[-1].isdigit():
                        current_visualization = key_list[-1]

                        if copy_id == current_visualization:
                            new_key_list = list(key_list)
                            new_key_list[-1] = '1'
                            new_visualizations['_'.join(new_key_list)] = value

                        key_list[-1] = str(int(key_list[-1]) + 1)

                    existing_visualizations['_'.join(key_list)] = value

                new_visualizations.update(existing_visualizations)

                if len(new_visualizations) > 0:
                    data = new_visualizations

            visualizations = []
            text_boxes = []
            images = []
            maps = []
            tables = []
            break_lines = []

            for k, v in list(data.items()):
                '''
                TODO: save visualizations with key value e.g {'charts' :[]
                # 'images': []} for easier itteration
                '''
                if k.startswith('chart_field_graph_'):
                    visualization = {}
                    id = k.split('_')[-1]
                    visualization['type'] = 'chart'
                    visualization['order'] = int(id)
                    visualization['graph'] = \
                        data.get('chart_field_graph_{}'.format(id))
                    visualization['x_axis'] = \
                        data.get('chart_field_axis_x_{}'.format(id))
                    visualization['y_axis'] = \
                        data.get('chart_field_axis_y_{}'.format(id))
                    visualization['color'] = \
                        data.get('chart_field_color_{}'.format(id))
                    visualization['color_type'] = \
                        data.get('chart_field_color_type_{}'.format(id))
                    visualization['seq_color'] = \
                        data.get('seq_colors_hidden_input_{}'.format(id))
                    visualization['title'] = \
                        data.get('chart_field_title_{}'.format(id))
                    visualization['x_text_rotate'] = \
                        data.get('chart_field_x_text_rotate_{}'.format(id))
                    visualization['tooltip_name'] = \
                        data.get('chart_field_tooltip_name_{}'.format(id))
                    visualization['data_format'] = \
                        data.get('chart_field_data_format_{}'.format(id))
                    visualization['y_tick_format'] = \
                        data.get('chart_field_y_ticks_format_{}'.format(id))
                    visualization['x_tick_format'] = \
                        data.get('chart_field_x_ticks_format_{}'.format(id))
                    visualization['padding_bottom'] = \
                        data.get('chart_field_padding_bottom_{}'.format(id))
                    visualization['padding_top'] = \
                        data.get('chart_field_padding_top_{}'.format(id))
                    visualization['tick_count'] = \
                        data.get('chart_field_tick_count_{}'.format(id))
                    visualization['y_label'] = \
                        data.get('chart_field_y_label_{}'.format(id))
                    visualization['x_label'] = \
                        data.get('chart_field_x_label_{}'.format(id))
                    visualization['size'] = \
                        data.get('chart_field_size_{}'.format(id))
                    # visualization['chart_padding_left'] = \
                    #     data.get('chart_field_chart_padding_left_{}'.format(id))
                    visualization['chart_padding_bottom'] = \
                        data.get('chart_field_chart_padding_bottom_{}'.format(id))
                    visualization['static_reference_columns'] = \
                        toolkit.request.POST.getall(
                            'chart_field_static_reference_columns_%s' % id)
                    visualization['static_reference_label'] = \
                        data.get('chart_field_static_reference_label_%s' % id)
                    visualization['dynamic_reference_type'] = \
                        data.get('chart_field_dynamic_reference_type_%s' % id)
                    visualization['dynamic_reference_factor'] = \
                        data.get('chart_field_dynamic_reference_factor_%s' % id)
                    visualization['dynamic_reference_label'] = \
                        data.get('chart_field_dynamic_reference_label_%s' % id)
                    visualization['sort'] = \
                        data.get('chart_field_sort_{}'.format(id))
                    visualization['additional_description'] = \
                        data.get('chart_field_desc_{}'.format(id))
                    visualization['plotly'] = \
                        data.get('chart_field_plotly_{}'.format(id))

                    def line_attr_search(data, id, line_attr):
                        base_id = 'chart_field_{}_{}_'.format(line_attr, id)
                        line_count = len([
                            True for key, value in list(data.items())
                            if base_id in key
                        ])
                        line_attrs = []

                        for i in range(1, line_count + 1):
                            line_attr_id = base_id + str(i)

                            if line_attr_id in data:
                                line_attrs.append(data[line_attr_id])

                        return ','.join(line_attrs)

                    visualization['line_types'] = line_attr_search(data, id, 'line_type')
                    visualization['line_widths'] = line_attr_search(data, id, 'line_width')

                    bar_width = data.get('chart_field_bar_width_{}'.format(id))

                    if not bar_width or bar_width == 'None':
                        visualization['bar_width'] = \
                            data.get('chart_field_bar_width_{}'.format(id))
                    else:
                        visualization['bar_width'] = \
                            str(round(float(data.get(
                                'chart_field_bar_width_{}'.format(id))) / 10, 2
                            ))

                    donut_hole = data.get('chart_field_donut_hole_{}'.format(id))

                    if not donut_hole or donut_hole == 'None':
                        visualization['donut_hole'] = \
                            data.get('chart_field_donut_hole_{}'.format(id))
                    else:
                        visualization['donut_hole'] = \
                            str(round(float(data.get(
                                'chart_field_donut_hole_{}'.format(id))) / 10, 2
                            ))

                    visualization['upper_bounds'] = \
                        data.get('chart_field_upper_bounds_{}'.format(id))
                    visualization['lower_bounds'] = \
                        data.get('chart_field_lower_bounds_{}'.format(id))
                    if 'chart_field_show_bounds_{}'.format(id) in data:
                        visualization['show_bounds'] = 'true'
                    else:
                        visualization['show_bounds'] = 'false'
                    if 'chart_field_x_text_multiline_{}'.format(id) in data:
                        visualization['x_text_multiline'] = 'true'
                    else:
                        visualization['x_text_multiline'] = 'false'
                    visualization['x_tick_culling_max'] = \
                        data.get('chart_field_x_tick_culling_max_{}'.format(id))
                    if 'chart_field_legend_{}'.format(id) in data:
                        visualization['show_legend'] = 'true'
                    else:
                        visualization['show_legend'] = 'false'
                    if 'chart_field_leg_title_{}'.format(id) in data:
                        visualization['show_legend_title'] = 'true'
                    else:
                        visualization['show_legend_title'] = 'false'
                    if 'custom_legend_title_{}'.format(id) in data:
                        visualization['custom_legend_title'] = \
                            data.get('custom_legend_title_{}'.format(id))
                    if 'chart_field_show_annotations_{}'.format(id) in data:
                        visualization['show_annotations'] = 'true'
                    else:
                        visualization['show_annotations'] = 'false'
                    if 'chart_field_labels_{}'.format(id) in data:
                        visualization['show_labels'] = 'true'
                    else:
                        visualization['show_labels'] = 'false'
                    if 'chart_field_y_label_hide_{}'.format(id) in data:
                        visualization['y_label_hide'] = 'true'
                    else:
                        visualization['y_label_hide'] = 'false'
                    if 'chart_field_x_label_hide_{}'.format(id) in data:
                        visualization['x_label_hide'] = 'true'
                    else:
                        visualization['x_label_hide'] = 'false'
                    if 'chart_field_show_labels_as_percentages_{}'.format(id) in data:
                        visualization['show_labels_as_percentages'] = 'true'
                    else:
                        visualization['show_labels_as_percentages'] = 'false'
                    if 'chart_field_y_from_zero_{}'.format(id) in data:
                        visualization['y_from_zero'] = 'true'
                    else:
                        visualization['y_from_zero'] = 'false'
                    visualization['axis_max'] = \
                        data.get('chart_field_axis_max_{}'.format(id))
                    visualization['axis_min'] = \
                        data.get('chart_field_axis_min_{}'.format(id))
                    if 'chart_field_axis_range_{}'.format(id) in data:
                        visualization['axis_range'] = 'true'
                    else:
                        visualization['axis_range'] = 'false'
                    if 'chart_field_x_from_zero_{}'.format(id) in data:
                        visualization['x_from_zero'] = 'true'
                    else:
                        visualization['x_from_zero'] = 'false'
                    if data.get('chart_field_filter_name_{}'.format(id)):
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

                    if 'chart_field_category_name_{}'.format(id) in data:
                        visualization['category_name'] = \
                                data['chart_field_category_name_{}'.format(id)]
                    else:
                        visualization['category_name'] = ''

                    if 'chart_field_x_sort_labels_{}'.format(id) in data:
                        visualization['x_sort_labels'] = 'true'
                    else:
                        visualization['x_sort_labels'] = 'false'

                    #print data

                    visualizations.append(visualization)

                if k.startswith('text_box_description_'):
                    text_box = {}
                    id = k.split('_')[-1]
                    text_box['type'] = 'text_box'
                    text_box['order'] = int(id)
                    text_box['description'] = \
                        data['text_box_description_{}'.format(id)]
                    text_box['column_width'] = \
                        data.get('text_box_column_width_{}'.format(id), 'Half')

                    text_boxes.append(text_box)

                if k.startswith('line_break_'):
                    break_line = {}
                    id = k.split('_')[-1]
                    break_line['type'] = 'break_line'
                    break_line['order'] = int(id)

                    break_lines.append(break_line)

                if k.startswith('media_image_url_'):
                    image = {}
                    id = k.split('_')[-1]
                    image['type'] = 'image'
                    image['order'] = int(id)

                    image_url = data['media_image_url_{}'.format(id)]

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

                    images.append(image)

                if k.startswith('map_resource_'):
                    map_item = {}
                    id = k.split('_')[-1]
                    map_item['type'] = 'map'
                    map_item['order'] = int(id)
                    map_item['map_resource'] = \
                        data['map_resource_{}'.format(id)]
                    map_item['map_title_field'] = \
                        data['map_title_field_{}'.format(id)]
                    map_item['map_custom_title_field'] = \
                        data.get('map_custom_title_field_{}'.format(id))
                    map_item['map_infobox_title'] = \
                        data.get('map_infobox_title_{}'.format(id))
                    map_item['map_key_field'] = \
                        data['map_key_field_{}'.format(id)]
                    map_item['data_key_field'] = \
                        data['map_data_key_field_{}'.format(id)]
                    map_item['data_format'] = \
                        data['map_data_format_{}'.format(id)]
                    map_item['seq_colors'] = \
                        data['seq_colors_hidden_input_{}'.format(id)]
                    map_item['data_categories'] = \
                        data['map_data_categories_{}'.format(id)]
                    map_item['size'] = \
                        data.get('map_size_{}'.format(id))

                    if data.get('map_field_filter_name_{}'.format(id)):
                        map_item['filter_name'] = \
                            data['map_field_filter_name_{}'.format(id)]
                        map_item['filter_value'] = \
                            data['map_field_filter_value_{}'.format(id)]
                        map_item['filter_alias'] = \
                            data['map_field_filter_alias_{}'.format(id)]
                        map_item['filter_visibility'] = \
                            data['map_field_filter_visibility_{}'.format(id)]
                    else:
                        map_item['filter_name'] = ''
                        map_item['filter_value'] = ''
                        map_item['filter_alias'] = ''
                        map_item['filter_visibility'] = ''

                    maps.append(map_item)

                if k.startswith('table_field_title_'):
                    table_item = {}
                    id = k.split('_')[-1]
                    table_item['type'] = 'table'
                    table_item['order'] = int(id)
                    table_item['y_axis'] = \
                        data['choose_y_axis_column']
                    table_item['main_value'] = \
                        data['table_main_value_{}'.format(id)]
                    table_item['second_value'] = \
                        data['table_second_value_{}'.format(id)]
                    table_item['title'] = \
                        data['table_field_title_{}'.format(id)]
                    table_item['data_format'] = \
                        data['table_data_format_{}'.format(id)]
                    if data.get('table_field_filter_name_{}'.format(id)):
                        table_item['filter_name'] = \
                            data['table_field_filter_name_{}'.format(id)]
                        table_item['filter_value'] = \
                            data['table_field_filter_value_{}'.format(id)]
                        table_item['filter_alias'] = \
                            data['table_field_filter_alias_{}'.format(id)]
                        table_item['filter_visibility'] = \
                            data['table_field_filter_visibility_{}'.format(id)]
                    else:
                        table_item['filter_name'] = ''
                        table_item['filter_value'] = ''
                        table_item['filter_alias'] = ''
                        table_item['filter_visibility'] = ''

                    if data.get('table_category_name_{}'.format(id)):
                        table_item['category_name'] = \
                                data['table_category_name_{}'.format(id)]
                    else:
                        table_item['category_name'] = ''

                    tables.append(table_item)

            vis = visualizations + text_boxes + images + maps + tables + break_lines
            _visualization_items['visualizations'] = json.dumps(vis)

            if 'choose_y_axis_column' in data:
                _visualization_items['y_axis_column'] = \
                    data['choose_y_axis_column']
            else:
                _visualization_items['y_axis_column'] = ''

            try:
                junk = _get_action('querytool_visualizations_update',
                                   _visualization_items)
                if is_copy:
                    h.flash_success(_('Visualization Successfully copied'))
                else:
                    h.flash_success(_('Visualizations Successfully updated.'))
            except ValidationError as e:
                errors = e.error_dict
                error_summary = e.error_summary
                return self.querytool_edit('/' + querytool, data,
                                           errors, error_summary)

            if 'save-edit-data' in list(data.keys()):
                # redirect to edit data
                url = h.url_for('querytool_edit',
                                querytool='/' + _querytool['name'])
            elif is_copy is True:
                # reload page with new visualization
                url = h.url_for(
                    'querytool_edit_visualizations',
                    querytool= '/' + _querytool['name']
                )
            else:
                h.redirect_to('/'+h.lang()+'/group/'+_querytool['group']+'/reports')

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
        data['main_filters'] = _querytool.get('filters')

        # Add slug to filters
        main_filters = []
        for filter in json.loads(data['main_filters']):
            filter['slug'] = helpers.slugify(filter.get('alias', ''))
            main_filters.append(filter)
        data['main_filters'] = json.dumps(main_filters)

        # This is required in order to exclude
        # main filters in chart item filter options
        main_filters_names = []
        for filter in main_filters:
            main_filters_names.append(filter['name'])
        data['main_filters_names'] = ','.join(main_filters_names)

        data['y_axis_columns'] = helpers.parse_y_axis_columns(
            data.get('y_axis_columns'))

        data['y_axis_options'] = [{'value': column['name'], 'text': column['alias']} for column in data['y_axis_columns']]

        # We need y_axis_columns names in comma separated
        # format because ajax snippets only support String parameters
        # This parameter is used for removing
        # Y axis values from the rest of the
        #  filtering options and the X axis values in viz items
        data['y_axis_values'] = ','.join([column['name'] for column in data['y_axis_columns']])
        data['owner_org'] = _querytool.get('owner_org')

        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary}

        return render('querytool/admin/base_edit_visualizations.html',
                      extra_vars=vars)

    def querytool_public(self):
        '''
        Lists all available groups
        :return: base template
        '''
        return render('querytool/public/base_main.html',
                      extra_vars={'msg': 'Groups'})


    def querytool_public_reports(self):
        '''
        Lists all available groups
        :return: base template
        '''
        parent_name = toolkit.request.params.get('parent')
        q = toolkit.request.params.get('report_q', '')
        context = _get_context()
        extra_vars = {}

        if parent_name == '__misc__group__':
            misc_groups = _get_action('get_available_groups', {})
            misc_groups = ','.join([
                group['name'] for group in misc_groups
                if group['group_relationship_type'] != 'parent'
            ])
            querytool_search_results = qmodel.child_group_report_search(
                query_string=q, query_children=misc_groups
            )
            querytools = [
                querytool for querytool in querytool_search_results
            ]
            extra_vars['parent'] = parent_name

        elif parent_name:
            parent_group = _get_action('group_show', {'id': parent_name})
            children_names = parent_group.get('children')

            querytool_search_results = qmodel.child_group_report_search(
                query_string=q, query_children=children_names
            )
            querytools = [
                querytool for querytool in querytool_search_results
            ]

        else:
            groups = helpers.get_groups()

            querytools = _get_action('querytool_list_other', {'groups': groups})

            if q:
                querytool_search_results = helpers.querytool_search(query_string=q)
                querytool_search_results_names = [
                    querytool.name for querytool in querytool_search_results
                ]
                querytools = [
                    querytool for querytool in querytools if
                    querytool['name'] in querytool_search_results_names
                ]

        extra_vars['data'] = querytools

        return render(
            'querytool/public/reports.html',
            extra_vars=extra_vars
        )


    def querytool_public_list(self, group):
        '''
        List all of the available query tools
        :return: querytool list template page
        '''
        from_parent = toolkit.request.params.get('from_parent', False)
        parent_group_children = toolkit.request.params.get('parent_group_children', False)
        parent_title = toolkit.request.params.get('title', False)
        q = toolkit.request.params.get('report_q', '')

        if group == '__misc__group__':
            group = {
                'misc_group': True,
                'title': 'Other',
                'description': 'Miscellaneous groups',
                'name': '__misc__group__'
            }
            child_group_search_results = []

            if q:
                child_group_search_results = helpers.child_group_search(
                    query_string=q,
                    query_children=parent_group_children,
                    misc_group=True
                )

            return render(
                'querytool/public/list.html',
                extra_vars={
                    'child_groups': child_group_search_results,
                    'group': group,
                    'from_parent': True,
                    'title': parent_title
                }
            )

        group_details = _get_action('group_show', {'id': group})

        if from_parent and parent_group_children:
            child_group_search_results = []

            if q:
                child_group_search_results = helpers.child_group_search(
                    query_string=q, query_children=parent_group_children
                )

            return render(
                'querytool/public/list.html',
                extra_vars={
                    'child_groups': child_group_search_results,
                    'group': group_details,
                    'from_parent': True,
                    'title': parent_title
                }
            )
        else:
            querytools = _get_action('querytool_public_list', {'group': group})

            if q:
                querytool_search_results = helpers.querytool_search(
                    query_string=q, query_group=group
                )
                querytool_search_results_names = [
                    querytool.name for querytool in querytool_search_results
                ]
                querytools = [
                    querytool for querytool in querytools if
                    querytool['name'] in querytool_search_results_names
                ]

            if from_parent:
                extra_vars = {
                    'data': querytools,
                    'group': group_details,
                    'from_parent': True,
                    'title': parent_title
                }
            else:
                extra_vars = {
                    'data': querytools,
                    'group': group_details
                }
            return render(
                'querytool/public/list.html',
                extra_vars=extra_vars
            )

    def querytool_public_read(self, name):
        '''
        :return: base template
        '''
        querytool = _get_action('querytool_public_read', {'name': name})

        if not querytool:
            abort(404, _('Report not found.'))

        # only sysadmins or organization members can access private querytool
        if querytool['private'] is True:
            context = _get_context()
            try:
                check_access('querytool_show', context, {'name': name})
            except NotAuthorized:
                abort(403, _('Not authorized to see this page'))

        # Check if the data for this querytool still exists
        if querytool['dataset_name']:
            try:
                _get_action('package_show',
                            {'id': querytool['dataset_name']})
            except NotFound:
                abort(404, _('The data used for creating this '
                             'report has been removed '
                             'by the administrator.'))

        if not querytool['visualizations']:
            abort(404, _('Report not fully set.'))

        params = toolkit.request.params

        parent = params.get('parent', None)
        parent_title = params.get('title', None)
        from_parent = params.get('from_parent', False)

        querytools = []
        items = []
        items.append({'order': 0, 'name': querytool['name']})

        if querytool['related_querytools']:
            items.extend(json.loads(querytool['related_querytools']))

        items.sort(key=itemgetter('order'))
        for item in items:

            q_item = _get_action(
                'querytool_public_read',
                {'name': item['name']}
            )
            if q_item:
                q_item['visualizations'] = json.loads(
                    q_item['visualizations']
                )
                q_item['visualizations'].sort(key=itemgetter('order'))

                q_name = q_item['name']
                new_filters = json.loads(q_item['filters'])

                for k, v in list(params.items()):
                    # Update query filters
                    if k.startswith('{}_data_filter_name_'.format(q_name)):
                        id = k.split('_')[-1]
                        for filter in new_filters:
                            # Apply changes only on public filters
                            # to protect changing private
                            # filters by changing the url query params
                            if filter['visibility'] == 'public':
                                if v == filter.get('name'):
                                    filter['value'] = \
                                        params.get('{}_data_filter_value_{}'
                                                   .format(q_name, id))
                                # Replace & with %26 to fix the error for graphs
                                # not being generated for values with & in them
                                filter['value'] = filter['value'].replace('&','%26')
                    # Update charts y_axis value
                    if k.startswith('{}_y_axis_column'.format(q_name)):
                        q_item['y_axis_column'] = v
                    # Update visualizations filters
                    if k.startswith('{}_viz_filter_name'.format(q_name)):
                        id = k.split('_')[-1]
                        for visualization in q_item['visualizations']:
                            if visualization['order'] == int(id):
                                visualization['filter_name'] = \
                                    params.get('{}_viz_filter_name_{}'.
                                               format(q_name, id))
                                visualization['filter_value'] = \
                                    params.get('{}_viz_filter_value_{}'.
                                               format(q_name, id))

                for image in q_item['visualizations']:
                    if image['type'] == 'image':
                        is_upload = image['url'] and not image[
                            'url'].startswith('http')

                        if is_upload:
                            image['url'] = '{0}/uploads/vs/{1}'.format(
                                toolkit.request.host_url, image['url'])

                # Default to first new filter after updating visualizations
                for vis in q_item.get('visualizations', []):
                    resource_id = q_item.get('chart_resource')
                    filter_name = vis.get('filter_name')
                    visibility = vis.get('filter_visibility')
                    filter_value = vis.get('filter_value')

                    if resource_id and filter_name and \
                       visibility == 'public':
                        updated_filters = helpers.get_filter_values(
                            resource_id, filter_name, new_filters
                        )

                        if filter_value and filter_value not in \
                           updated_filters and len(updated_filters) > 0:
                            vis['filter_value'] = updated_filters[0]

                related_sql_string = helpers.create_query_str(
                    q_item.get('chart_resource'),
                    new_filters
                )

                q_item['public_filters'] = new_filters
                q_item['public_filters'].sort(key=itemgetter('order'))
                q_item['sql_string'] = related_sql_string

                # Add slug to filters
                for filter in new_filters:
                    filter['slug'] = helpers.slugify(filter.get('alias', ''))

                # Need this hack for chart filter
                q_item['public_main_filters'] = json.dumps(new_filters)

                querytools.append(q_item)

        embed = True if 'embed' in params and params['embed'] == 'true' else False

        extra_vars = {
            'querytools': querytools,
            'embed': embed
        }

        if parent and parent_title and from_parent:
            extra_vars['parent'] = parent
            extra_vars['parent_title'] = parent_title
            extra_vars['from_parent'] = from_parent

        return render(
            'querytool/public/read.html',
            extra_vars=extra_vars
        )

    def querytool_download_data(self, name):
        params = request.params
        file_format = params['format']
        sql_string = params['sql_string']

        query = _get_action('querytool_get', {'name': name})

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
