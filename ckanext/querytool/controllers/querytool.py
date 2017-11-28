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

    def show(self):
        '''

        :return: query show template
        '''

        try:
            # TODO create, integrate authorization funtions
            # check_access('squerytool_show', context)
            pass

        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base.html',
                      extra_vars={
                          'msg': 'This is the Query Tool'
                                 ' administration page show'})

    def edit(self):
        '''

        :return: query edit template
        '''
        data = request.POST
        # TODO create, integrate authorization funtions
        if 'save' in data:
            try:
                data_dict = dict(request.POST)
                del data_dict['save']
                data = _get_action('querytool_create_query', data_dict)
                h.flash_success(_('Successfully updated.'))
            except logic.ValidationError, e:
                errors = e.error_dict
                error_summary = e.error_summary
                vars = {'data': data, 'errors': errors,
                        'error_summary': error_summary}
        vars = {'data': data, 'errors': {}}

        return render('querytool/admin/edit.html',
                              extra_vars=vars)

    def index(self):
        '''

        :return: base template
        '''
        return render('querytool/public/base.html',
                      extra_vars={'msg': 'This is the Query Tool public '
                                  'page and will be build from scratch'})
