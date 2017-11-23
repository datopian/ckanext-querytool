# encoding: utf-8

import logging

import ckan.lib.base as base
import ckan.lib.helpers as h
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, request, c, _

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


class QueryTool(base.BaseController):

    def _get_context(self):

        context = {'model': model, 'session': model.Session,
                   'user': c.user, 'for_view': True,
                   'with_private': False}

        return context


    def edit(self):

        context = self._get_context()

        try:
            ## TODO create, integrate authorization funtions
            #check_access('squerytool_edit', context)
            pass

        except NotAuthorized:
            abort(403, _('Not authorized to see this page'))

        return render('querytool/admin/base.html',
                      extra_vars={'msg': 'This is the Query Tool administration page'})

    def index(self):

        return render('querytool/public/base.html',
                      extra_vars={'msg': 'This is the Query Tool public page and will be build from scratch'})