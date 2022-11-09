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
from ckan.controllers.group import GroupController
from ckanext.querytool.logic.action import get as querytool_get

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


class QuerytoolGroupController(GroupController):
    def read_all_reports(self):
        groups = helpers.get_groups()
        reports = helpers._get_action('querytool_list_other', {'groups': groups})

        q = toolkit.request.params.get('report_q', '')

        if q:
            querytool_search_results = helpers.querytool_search(query_string=q)
            querytool_search_results_names = [
                querytool.name for querytool in querytool_search_results
            ]
            reports = [
                querytool for querytool in reports if
                querytool['name'] in querytool_search_results_names
            ]

        return self._render_template('group/report_index.html', {'reports': reports})


    def read_report(self, id):
        group_type = self._ensure_controller_matches_group_type(
            id.split('@')[0])

        context = {'model': model, 'session': model.Session,
                   'user': c.user,
                   'schema': self._db_to_form_schema(group_type=group_type),
                   'for_view': True}
        data_dict = {'id': id, 'type': group_type}

        # unicode format (decoded from utf8)
        c.q = request.params.get('q', '')

        try:
            # Do not query for the group datasets when dictizing, as they will
            # be ignored and get requested on the controller anyway
            data_dict['include_datasets'] = False
            c.group_dict = self._action('group_show')(context, data_dict)
            c.group = context['group']
            c.reports = toolkit.get_action('querytool_list_by_group')(context, {'group': id})

        except (NotFound, NotAuthorized):
            abort(404, _('Group not found'))

        return self._render_template('group/reports.html', {'id': id})

