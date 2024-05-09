# encoding: utf-8
from __future__ import annotations

import logging
import re
from collections import OrderedDict
from typing import Any, Optional, Union, cast
from typing_extensions import Literal

from urllib.parse import urlencode

import ckan.lib.base as base
from ckan.lib.helpers import helper_functions as h
from ckan.lib.helpers import Page
import ckan.lib.navl.dictization_functions as dict_fns
import ckan.logic as logic
import ckan.lib.search as search
import ckan.model as model
import ckan.authz as authz
import ckan.lib.plugins as lib_plugins
import ckan.plugins as plugins
from ckan.common import g, config, request, current_user, _
from ckan.views.home import CACHE_PARAMETERS
from ckan.views.dataset import _get_search_details

from flask import Blueprint
from flask.views import MethodView
from flask.wrappers import Response
from ckan.types import Action, Context, DataDict, Schema


NotFound = logic.NotFound
NotAuthorized = logic.NotAuthorized
ValidationError = logic.ValidationError
check_access = logic.check_access
get_action = logic.get_action
tuplize_dict = logic.tuplize_dict
clean_dict = logic.clean_dict
parse_params = logic.parse_params

log = logging.getLogger(__name__)

lookup_group_plugin = lib_plugins.lookup_group_plugin
lookup_group_controller = lib_plugins.lookup_group_controller

is_org = False


def _get_group_template(template_type: str, group_type: Optional[str] = None) -> str:
    group_plugin = lookup_group_plugin(group_type)
    method = getattr(group_plugin, template_type)
    try:
        return method(group_type)
    except TypeError as err:
        if u'takes 1' not in str(err) and u'takes exactly 1' not in str(err):
            raise
        return method()


def _setup_template_variables(
    context: Context, data_dict: DataDict, group_type: Optional[str] = None
) -> None:
    if u'type' not in data_dict:
        data_dict[u'type'] = group_type
    return lookup_group_plugin(group_type).setup_template_variables(context, data_dict)


def _replace_group_org(string: str) -> str:
    u'''substitute organization for group if this is an org'''
    if is_org:
        return re.sub(u'^group', u'organization', string)
    return string


def _action(action_name: str) -> Action:
    u'''select the correct group/org action'''
    return get_action(_replace_group_org(action_name))


def _check_access(action_name: str, *args: Any, **kw: Any) -> Literal[True]:
    u'''select the correct group/org check_access'''
    return check_access(_replace_group_org(action_name), *args, **kw)


def _force_reindex(grp: dict[str, Any]) -> None:
    u'''When the group name has changed, we need to force a reindex
    of the datasets within the group, otherwise they will stop
    appearing on the read page for the group (as they're connected via
    the group name)'''
    group = model.Group.get(grp['name'])
    assert group
    for dataset in group.packages():
        search.rebuild(dataset.name)


def _guess_group_type(expecting_name: bool = False) -> str:
    u"""
    Guess the type of group from the URL.
    * The default url '/group/xyz' returns None
    * group_type is unicode
    * this handles the case where there is a prefix on the URL
      (such as /data/organization)
    """
    parts: list[str] = request.path.split(u'/')
    parts = [x for x in parts if x]

    idx = 0
    if expecting_name:
        idx = -1

    gt = parts[idx]

    return gt


def set_org(is_organization: bool) -> None:
    global is_org
    is_org = is_organization


def index(group_type: str, is_organization: bool) -> str:
    extra_vars: dict[str, Any] = {}
    set_org(is_organization)
    page = h.get_page_number(request.args) or 1
    items_per_page = config.get('ckan.datasets_per_page')

    context = cast(
        Context,
        {
            u'model': model,
            u'session': model.Session,
            u'user': current_user.name,
            u'for_view': True,
            u'with_private': False,
        },
    )

    try:
        assert _check_access(u'site_read', context)
        assert _check_access(u'group_list', context)
    except NotAuthorized:
        base.abort(403, _(u'Not authorized to see this page'))

    q = request.args.get(u'q', u'')
    sort_by = request.args.get(u'sort')

    # TODO: Remove
    # ckan 2.9: Adding variables that were removed from c object for
    # compatibility with templates in existing extensions
    g.q = q
    g.sort_by_selected = sort_by

    extra_vars["q"] = q
    extra_vars["sort_by_selected"] = sort_by

    # pass user info to context as needed to view private datasets of
    # orgs correctly
    if current_user.is_authenticated:
        context['user_id'] = current_user.id  # type: ignore
        context['user_is_admin'] = current_user.sysadmin  # type: ignore

    try:
        data_dict_global_results: dict[str, Any] = {
            u'all_fields': False,
            u'q': q,
            u'sort': sort_by,
            u'type': group_type or u'group',
        }
        global_results = _action(u'group_list')(context, data_dict_global_results)
    except ValidationError as e:
        if e.error_dict and e.error_dict.get(u'message'):
            msg: Any = e.error_dict['message']
        else:
            msg = str(e)
        h.flash_error(msg)
        extra_vars["page"] = Page([], 0)
        extra_vars["group_type"] = group_type
        return base.render(
            _get_group_template(u'index_template', group_type), extra_vars
        )

    data_dict_page_results: dict[str, Any] = {
        u'all_fields': True,
        u'q': q,
        u'sort': sort_by,
        u'type': group_type or u'group',
        u'limit': items_per_page,
        u'offset': items_per_page * (page - 1),
        u'include_extras': True,
    }
    page_results = _action(u'group_list')(context, data_dict_page_results)

    extra_vars["page"] = Page(
        collection=global_results,
        page=page,
        url=h.pager_url,
        items_per_page=items_per_page,
    )

    extra_vars["page"].items = page_results
    extra_vars["group_type"] = group_type

    # TODO: Remove
    # ckan 2.9: Adding variables that were removed from c object for
    # compatibility with templates in existing extensions
    g.page = extra_vars["page"]
    return base.render(_get_group_template(u'index_template', group_type), extra_vars)


class CreateGroupView(MethodView):
    u'''Create group view'''

    def _prepare(self, data: Optional[dict[str, Any]] = None) -> Context:
        if data and u'type' in data:
            group_type = data['type']
        else:
            group_type = _guess_group_type()
        if data:
            data['type'] = group_type

        context = cast(
            Context,
            {
                u'model': model,
                u'session': model.Session,
                u'user': current_user.name,
                u'save': u'save' in request.args,
                u'parent': request.args.get(u'parent', None),
                u'group_type': group_type,
            },
        )

        try:
            assert _check_access(u'group_create', context)
        except NotAuthorized:
            base.abort(403, _(u'Unauthorized to create a group'))

        return context

    def post(self, group_type: str, is_organization: bool) -> Union[Response, str]:
        set_org(is_organization)
        context = self._prepare()
        try:
            data_dict = clean_dict(
                dict_fns.unflatten(tuplize_dict(parse_params(request.form)))
            )
            data_dict.update(
                clean_dict(
                    dict_fns.unflatten(tuplize_dict(parse_params(request.files)))
                )
            )
        except dict_fns.DataError:
            base.abort(400, _(u'Integrity Error'))
        user = current_user.name
        data_dict['type'] = group_type or u'group'
        data_dict['users'] = [{u'name': user, u'capacity': u'admin'}]
        try:
            group = _action(u'group_create')(context, data_dict)
        except (NotFound, NotAuthorized):
            base.abort(404, _(u'Group not found'))
        except ValidationError as e:
            errors = e.error_dict
            error_summary = e.error_summary
            return self.get(
                group_type, is_organization, data_dict, errors, error_summary
            )

        return h.redirect_to(cast(str, group['type']) + u'.read', id=group['name'])

    def get(
        self,
        group_type: str,
        is_organization: bool,
        data: Optional[dict[str, Any]] = None,
        errors: Optional[dict[str, Any]] = None,
        error_summary: Optional[dict[str, Any]] = None,
    ) -> str:
        extra_vars = {}
        set_org(is_organization)
        context = self._prepare()
        data = data or clean_dict(
            dict_fns.unflatten(
                tuplize_dict(parse_params(request.args, ignore_keys=CACHE_PARAMETERS))
            )
        )

        if not data.get(u'image_url', u'').startswith(u'http'):
            data.pop(u'image_url', None)
        errors = errors or {}
        error_summary = error_summary or {}
        extra_vars: dict[str, Any] = {
            u'data': data,
            u'errors': errors,
            u'error_summary': error_summary,
            u'action': u'new',
            u'group_type': group_type,
        }
        _setup_template_variables(context, data, group_type=group_type)
        form = base.render(_get_group_template(u'group_form', group_type), extra_vars)

        # TODO: Remove
        # ckan 2.9: Adding variables that were removed from c object for
        # compatibility with templates in existing extensions
        g.form = form

        extra_vars["form"] = form
        return base.render(_get_group_template(u'new_template', group_type), extra_vars)


class EditGroupView(MethodView):
    u'''Edit group view'''

    def _prepare(self, id: Optional[str]) -> Context:
        data_dict: dict[str, Any] = {u'id': id, u'include_datasets': False}

        context = cast(
            Context,
            {
                u'model': model,
                u'session': model.Session,
                u'user': current_user.name,
                u'save': u'save' in request.args,
                u'for_edit': True,
                u'parent': request.args.get(u'parent', None),
                u'id': id,
            },
        )

        try:
            _action(u'group_show')(context, data_dict)
            _check_access(u'group_update', context, {u'id': id})
        except NotAuthorized:
            base.abort(403, _(u'Unauthorized to create a group'))
        except NotFound:
            base.abort(404, _(u'Group not found'))

        return context

    def post(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Union[Response, str]:
        log.error(u'EditGroupView.post')
        set_org(is_organization)
        context = self._prepare(id)
        try:
            data_dict = clean_dict(
                dict_fns.unflatten(tuplize_dict(parse_params(request.form)))
            )
            data_dict.update(
                clean_dict(
                    dict_fns.unflatten(tuplize_dict(parse_params(request.files)))
                )
            )
        except dict_fns.DataError:
            base.abort(400, _(u'Integrity Error'))
        data_dict['id'] = context['id']
        context['allow_partial_update'] = True

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

                return self.get(
                    id, group_type, is_organization, data_dict, errors, error_summary
                )

        try:
            group = _action(u'querytool_group_update')(context, data_dict)
            if id != group['name']:
                _force_reindex(group)
        except (NotFound, NotAuthorized):
            base.abort(404, _(u'Group not found'))
        except ValidationError as e:
            errors = e.error_dict
            error_summary = e.error_summary
            assert id
            return self.get(
                id, group_type, is_organization, data_dict, errors, error_summary
            )
        return h.redirect_to(cast(str, group[u'type']) + u'.read', id=group[u'name'])

    def get(
        self,
        id: str,
        group_type: str,
        is_organization: bool,
        data: Optional[dict[str, Any]] = None,
        errors: Optional[dict[str, Any]] = None,
        error_summary: Optional[dict[str, Any]] = None,
    ) -> str:
        extra_vars = {}
        set_org(is_organization)
        context = self._prepare(id)
        data_dict: dict[str, Any] = {u'id': id, u'include_datasets': False}
        try:
            group_dict = _action(u'group_show')(context, data_dict)
        except (NotFound, NotAuthorized):
            base.abort(404, _(u'Group not found'))
        data = data or group_dict
        assert data is not None
        errors = errors or {}
        extra_vars: dict[str, Any] = {
            u'data': data,
            u"group_dict": group_dict,
            u'errors': errors,
            u'error_summary': error_summary,
            u'action': u'edit',
            u'group_type': group_type,
        }

        _setup_template_variables(context, data, group_type=group_type)
        form = base.render(_get_group_template(u'group_form', group_type), extra_vars)

        # TODO: Remove
        # ckan 2.9: Adding variables that were removed from c object for
        # compatibility with templates in existing extensions
        g.grouptitle = group_dict.get(u'title')
        g.groupname = group_dict.get(u'name')
        g.data = data
        g.group_dict = group_dict

        extra_vars["form"] = form
        return base.render(
            _get_group_template(u'edit_template', group_type), extra_vars
        )


class DeleteGroupView(MethodView):
    u'''Delete group view'''

    def _prepare(self, id: Optional[str] = None) -> Context:
        context = cast(
            Context,
            {
                u'model': model,
                u'session': model.Session,
                u'user': current_user.name,
            },
        )
        try:
            assert _check_access(u'group_delete', context, {u'id': id})
        except NotAuthorized:
            base.abort(403, _(u'Unauthorized to delete group %s') % u'')
        return context

    def post(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Response:
        set_org(is_organization)
        context = self._prepare(id)
        try:
            _action(u'group_delete')(context, {u'id': id})
            group_label = h.humanize_entity_type(
                u'group', group_type, u'has been deleted'
            ) or _(u'Group')
            h.flash_notice(_(u'%s has been deleted.') % _(group_label))
        except NotAuthorized:
            base.abort(403, _(u'Unauthorized to delete group %s') % u'')
        except NotFound:
            base.abort(404, _(u'Group not found'))
        except ValidationError as e:
            base.abort(403, _(e.error_dict['message']))

        return h.redirect_to(u'{}.index'.format(group_type))

    def get(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Union[str, Response]:
        set_org(is_organization)
        context = self._prepare(id)
        group_dict = _action(u'group_show')(context, {u'id': id})
        if u'cancel' in request.args:
            return h.redirect_to(u'{}.edit'.format(group_type), id=id)

        # TODO: Remove
        g.group_dict = group_dict
        extra_vars: dict[str, Any] = {
            u"group_dict": group_dict,
            u"group_type": group_type,
        }
        return base.render(_replace_group_org(u'group/confirm_delete.html'), extra_vars)


querytool_group = Blueprint(
    u'querytool_group',
    __name__,
    url_prefix=u'/group',
    url_defaults={u'group_type': u'group', u'is_organization': False},
)


def register_group_plugin_rules(blueprint: Blueprint) -> None:
    blueprint.add_url_rule(
        u'/new',
        methods=[u'GET', u'POST'],
        view_func=CreateGroupView.as_view(str(u'new')),
    )
    blueprint.add_url_rule(u'/edit/<id>', view_func=EditGroupView.as_view(str(u'edit')))
    blueprint.add_url_rule(
        u'/delete/<id>',
        methods=[u'GET', u'POST'],
        view_func=DeleteGroupView.as_view(str(u'delete')),
    )


register_group_plugin_rules(querytool_group)
