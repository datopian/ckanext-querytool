# encoding: utf-8

import logging

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
            pass

        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))
        querytools = _get_action('querytool_list', {})

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
            pass

        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base_show.html',
                      extra_vars={
                          'msg': 'This is the Query Tool'})

    def edit(self, page=None):
        '''
            Create new query tool

        :return: query create template page

        '''

        context = _get_context()
        data_q = {}
        _page = ''
        if page:
            data_q = {
                'name': page[1:]
            }
            _page = _get_action('querytool_get', data_dict=data_q)

        if _page is None and len(page) > 0:
            toolkit.abort(404, _('Page not found.'))

        if _page is None:
            _page = {}

        try:
            check_access('querytool_create', context)
        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))
        data = request.POST

        vars = {'data': _page, 'errors': {}}
        if 'save' in data:
            try:
                data_dict = dict(request.POST)
                del data_dict['save']
                data = _get_action('querytool_create', data_dict)
                h.flash_success(_('Data Successfully updated.'))
            except logic.ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                vars = {'data': data, 'errors': errors,
                        'error_summary': error_summary}
                return render('querytool/admin/base_edit_data.html',
                              extra_vars=vars)
            # redirect to manage visualisations
            url = h.url_for(controller=self.ctrl,
                            action='edit_visualizations')
            h.redirect_to(url)

            vars = {'data': data, 'errors': {}}

        return render('querytool/admin/base_edit_data.html',
                      extra_vars=vars)

    def delete(self, page=None):
        id = page[1:]
        resp = _get_action('querytool_delete', {'id': id})
        h.flash_success(_('Querytool was removed successfully.'))
        toolkit.redirect_to(h.url_for('querytool_list'))

    def edit_visualizations(self):
        '''
            Create or edit query tool functionality

        :return: query edit template page
        '''
        data = request.POST
        # TODO create, integrate authorization funtions
        if 'save' in data:
            try:
                data_dict = dict(request.POST)
                del data_dict['save']
                # data = _get_action('querytool_create_visualizations',
                # data_dict)
                h.flash_success(_('Query Tool successfully updated.'))
            except NotAuthorized:
                abort(403, _('Not authorized to see this page'))
            except logic.ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                vars = {'data': data, 'errors': errors,
                        'error_summary': error_summary}
                return render('querytool/admin/base_edit_visualizations.html',
                              extra_vars=vars)
            # redirect to query tools list
            url = h.url_for(controller=self.ctrl,
                            action='list')
            h.redirect_to(url)

        vars = {'data': data, 'errors': {}}

        return render('querytool/admin/base_edit_visualizations.html',
                      extra_vars=vars)

    def index(self):
        '''

        :return: base template
        '''
        return render('querytool/public/base.html',
                      extra_vars={'msg': 'This is the Query Tool public '
                                  'page and will be build from scratch'})
