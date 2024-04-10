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
import ckan.lib.uploader as uploader
from ckan.common import response, request
from ckan.controllers.group import GroupController
import ckan.lib.navl.dictization_functions as dict_fns

from ckanext.querytool.logic.action import get as querytool_get
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

    def edit(self, id, data=None, errors=None, error_summary=None):
        group_type = self._ensure_controller_matches_group_type(
            id.split('@')[0])

        context = {'model': model, 'session': model.Session,
                   'user': c.user,
                   'save': 'save' in request.params,
                   'for_edit': True,
                   'parent': request.params.get('parent', None)
                   }
        data_dict = {'id': id, 'include_datasets': False}

        if context['save'] and not data:
            return self._save_edit(id, context)

        try:
            data_dict['include_datasets'] = False
            old_data = self._action('group_show')(context, data_dict)
            c.grouptitle = old_data.get('title')
            c.groupname = old_data.get('name')
            data = data or old_data
        except (NotFound, NotAuthorized):
            abort(404, _('Group not found'))

        group = context.get("group")
        c.group = group
        c.group_dict = self._action('group_show')(context, data_dict)

        try:
            self._check_access('group_update', context)
        except NotAuthorized:
            abort(403, _('User %r not authorized to edit %s') % (c.user, id))

        errors = errors or {}
        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary, 'action': 'edit',
                'group_type': group_type}

        self._setup_template_variables(context, data, group_type=group_type)
        c.form = render(self._group_form(group_type), extra_vars=vars)
        return render(self._edit_template(c.group.type),
                      extra_vars={'group_type': group_type})

    def _save_edit(self, id, context):
        try:
            data_dict = clean_dict(dict_fns.unflatten(
                tuplize_dict(parse_params(request.params))))

            # Handle child groups that don't exist
            group_children = data_dict.get('children', [])

            if group_children:
                group_children = group_children.split(',') if group_children else []
                groups = logic.get_action('group_list')(context, {})
                invalid_groups = []

                for child in group_children:
                    if child not in groups:
                        invalid_groups.append(child)

                if invalid_groups:
                    error = {
                        'Children': 'Invalid child group(s) - %s' % ', '.join(invalid_groups)
                    }
                    errors = error
                    error_summary = error

                    return self.edit(id, data_dict, errors, error_summary)

            context['message'] = data_dict.get('log_message', '')
            data_dict['id'] = id
            context['allow_partial_update'] = True
            group = self._action('querytool_group_update')(context, data_dict)
            if id != group['name']:
                self._force_reindex(group)

            h.redirect_to('%s_read' % group['type'], id=group['name'])
        except (NotFound, NotAuthorized), e:
            abort(404, _('Group not found'))
        except dict_fns.DataError:
            abort(400, _(u'Integrity Error'))
        except ValidationError, e:
            errors = e.error_dict
            error_summary = e.error_summary
            return self.edit(id, data_dict, errors, error_summary)

    def delete(self, id):
        group_type = self._ensure_controller_matches_group_type(id)

        if 'cancel' in request.params:
            self._redirect_to_this_controller(action='edit', id=id)

        context = {'model': model, 'session': model.Session,
                   'user': c.user}

        try:
            self._check_access('group_delete', context, {'id': id})
        except NotAuthorized:
            abort(403, _('Unauthorized to delete group %s') % '')

        try:
            if request.method == 'POST':
                self._action('querytool_group_delete')(context, {'id': id})
                if group_type == 'organization':
                    h.flash_notice(_('Organization has been deleted.'))
                elif group_type == 'group':
                    h.flash_notice(_('Group has been deleted.'))
                else:
                    h.flash_notice(_('%s has been deleted.')
                                   % _(group_type.capitalize()))
                #self._redirect_to_this_controller(action='index')
                h.redirect_to(controller='group', action='index')
            c.group_dict = self._action('group_show')(context, {'id': id})
        except NotAuthorized:
            abort(403, _('Unauthorized to delete group %s') % '')
        except NotFound:
            abort(404, _('Group not found'))
        return self._render_template('group/confirm_delete.html', group_type)

    def new(self, data=None, errors=None, error_summary=None):
        if data and 'type' in data:
            group_type = data['type']
        else:
            group_type = self._guess_group_type(True)
        if data:
            data['type'] = group_type

        context = {'model': model, 'session': model.Session,
                   'user': c.user,
                   'save': 'save' in request.params,
                   'parent': request.params.get('parent', None)}
        try:
            self._check_access('group_create', context)
        except NotAuthorized:
            abort(403, _('Unauthorized to create a group'))

        if context['save'] and not data:
            return self._save_new(context, group_type)

        data = data or {}
        if not data.get('image_url', '').startswith('http'):
            data.pop('image_url', None)

        errors = errors or {}
        error_summary = error_summary or {}
        vars = {'data': data, 'errors': errors,
                'error_summary': error_summary, 'action': 'new',
                'group_type': group_type}

        self._setup_template_variables(context, data, group_type=group_type)
        c.form = render(self._group_form(group_type=group_type),
                        extra_vars=vars)
        return render(self._new_template(group_type),
                      extra_vars={'group_type': group_type})

    def _save_new(self, context, group_type=None):
        try:
            data_dict = clean_dict(dict_fns.unflatten(
                tuplize_dict(parse_params(request.params))))
            data_dict['type'] = group_type or 'group'
            context['message'] = data_dict.get('log_message', '')
            data_dict['users'] = [{'name': c.user, 'capacity': 'admin'}]
            group = self._action('querytool_group_create')(context, data_dict)

            # Redirect to the appropriate _read route for the type of group
            h.redirect_to(group['type'] + '_read', id=group['name'])
        except (NotFound, NotAuthorized), e:
            abort(404, _('Group not found'))
        except dict_fns.DataError:
            abort(400, _(u'Integrity Error'))
        except ValidationError, e:
            errors = e.error_dict
            error_summary = e.error_summary
            return self.new(data_dict, errors, error_summary)
