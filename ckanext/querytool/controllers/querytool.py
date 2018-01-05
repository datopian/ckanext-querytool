# encoding: utf-8
import logging
import json
from operator import itemgetter

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
from ckan.common import response, request
from ckan.plugins import toolkit
import ckan.lib.helpers as h

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

        h.flash_success(_('Querytool was removed successfully.'))
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
        _querytool = get_action('querytool_get')({}, data_dict)

        if _querytool is None and len(querytool) > 0:
            abort(404, _('Querytool not found.'))

        if _querytool is None:
            _querytool = {}

        if toolkit.request.method == 'POST' and not data:
            data = dict(toolkit.request.POST)
            filters = []

            for k, v in data.items():

                if k.startswith('data_filter_name_'):
                    filter = {}
                    id = k.split('_')[-1]
                    filter['order'] = int(id)
                    filter['name'] = data['data_filter_name_{}'.format(id)]
                    filter['value'] = data['data_filter_value_{}'.format(id)]
                    filter['alias'] = data['data_filter_alias_{}'.format(id)]

                    filters.append(filter)

            _querytool['filters'] = json.dumps(filters)
            _querytool.update(data)
            _querytool['querytool'] = querytool

            try:
                junk = _get_action('querytool_update', _querytool)
                h.flash_success(_('Data Successfully updated.'))
            except ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                return self.querytool_edit('/' + querytool, data,
                                           errors, error_summary)
            # redirect to manage visualisations
            url = h.url_for('querytool_edit_visualizations',
                            querytool='/' + querytool)
            h.redirect_to(url)

        if not data:
            data = _querytool

        if 'filters' in data and len(data['filters']) > 0:
            data['filters'] = json.loads(data['filters'])
            data['filters'].sort(key=itemgetter('order'))

        if 'dataset_name' in data:
            try:
                package = _get_action('package_show',
                                      {'id': data['dataset_name']})
                resource = package['resources'][0]
                resource_fields = _get_action('get_resource_fields',
                                              {'resource': resource})
                c.active_filters = ','.join(resource_fields)
                print c.active_filters
            except NotFound:
                abort(404, _('Package not found'))

        errors = errors or {}
        error_summary = error_summary or {}

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
            get_action('querytool_get_visualizations')({}, data_dict)
        if _visualization_items is None and len(querytool) > 0:
            abort(404, _('Querytool visualizations not found.'))

        if _visualization_items is None:
            _visualization_items = {}

        if toolkit.request.method == 'POST' and not data:
            data = dict(toolkit.request.POST)

            try:
                junk = _get_action('querytool_visualizations_update',
                                   data)
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

        errors = errors or {}
        error_summary = error_summary or {}

        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary}
        return render('querytool/admin/base_edit_visualizations.html',
                      extra_vars=vars)

    def querytool_public(self):
        '''

        :return: base template
        '''
        return render('querytool/public/base_main.html',
                      extra_vars={'msg': 'This is the Query Tool public '
                                  'page and will be build from scratch'})

    def querytool_public_data(self):
        '''

        :return: base template
        '''
        querytools = _get_action('querytool_list', {})

        return render('querytool/public/base_data.html',
                      extra_vars={'data': querytools})

    def querytool_public_data_list(self, name):
        '''

        :return: base template
        '''
        querytool = ''
        if name:
            querytool = name

        return render('querytool/public/base_data_list.html',
                      extra_vars={'querytool': querytool})
