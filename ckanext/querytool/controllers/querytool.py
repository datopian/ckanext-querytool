# encoding: utf-8

import logging

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
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


class QueryToolController(base.BaseController):

    def _get_context(self):

        context = {'model': model, 'session': model.Session,
                   'user': c.user, 'for_view': True,
                   'with_private': False}

        return context

    def show(self):
        '''

        :return: query show template
        '''
        context = self._get_context()

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
        context = self._get_context()
        data = dict(request.POST)
        try:
            # TODO create, integrate authorization funtions
            # check_access('squerytool_edit', context)
            pass

        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))
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
