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
from ckan.common import g, c, config, request, current_user, _
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
        if "takes 1" not in str(err) and "takes exactly 1" not in str(err):
            raise
        return method()


def _setup_template_variables(
    context: Context, data_dict: DataDict, group_type: Optional[str] = None
) -> None:
    if "type" not in data_dict:
        data_dict["type"] = group_type
    return lookup_group_plugin(group_type).setup_template_variables(context, data_dict)


def _replace_group_org(string: str) -> str:
    """substitute organization for group if this is an org"""
    if is_org:
        return re.sub("^group", "organization", string)
    return string


def _action(action_name: str) -> Action:
    """select the correct group/org action"""
    return get_action(_replace_group_org(action_name))


def _check_access(action_name: str, *args: Any, **kw: Any) -> Literal[True]:
    """select the correct group/org check_access"""
    return check_access(_replace_group_org(action_name), *args, **kw)


def _force_reindex(grp: dict[str, Any]) -> None:
    """When the group name has changed, we need to force a reindex
    of the datasets within the group, otherwise they will stop
    appearing on the read page for the group (as they're connected via
    the group name)"""
    group = model.Group.get(grp["name"])
    assert group
    for dataset in group.packages():
        search.rebuild(dataset.name)


def _guess_group_type(expecting_name: bool = False) -> str:
    """
    Guess the type of group from the URL.
    * The default url '/group/xyz' returns None
    * group_type is unicode
    * this handles the case where there is a prefix on the URL
      (such as /data/organization)
    """
    parts: list[str] = request.path.split("/")
    parts = [x for x in parts if x]

    idx = 0
    if expecting_name:
        idx = -1

    gt = parts[idx]

    return gt


def set_org(is_organization: bool) -> None:
    global is_org
    is_org = is_organization


def read_reports(id: str, group_type: str, is_organization: bool):
    extra_vars: dict[str, Any] = {
        "group_type": group_type,
    }
    context = {
        "model": model,
        "session": model.Session,
        "user": current_user.name,
        "userobj": current_user,
        "for_view": True,
    }
    data_dict = {"id": id, "type": group_type}

    # unicode format (decoded from utf8)
    c.q = request.args.get("q", "")

    try:
        data_dict["include_datasets"] = True
        extra_vars["group_dict"] = get_action("group_show")(context, data_dict)
        extra_vars["group"] = context["group"]
        extra_vars["userobj"] = ({"id": current_user.id},)
        extra_vars["reports"] = get_action("querytool_list_by_group")(
            context, {"group": id}
        )

    except (NotFound, NotAuthorized):
        base.abort(404, _("Group not found"))

    extra_vars["id"] = id
    return base.render("group/reports.html", extra_vars)


def index(group_type: str, is_organization: bool) -> str:
    extra_vars: dict[str, Any] = {}
    set_org(is_organization)
    page = h.get_page_number(request.args) or 1
    items_per_page = config.get("ckan.datasets_per_page")

    context = cast(
        Context,
        {
            "model": model,
            "session": model.Session,
            "user": current_user.name,
            "for_view": True,
            "with_private": False,
        },
    )

    try:
        assert _check_access("site_read", context)
        assert _check_access("group_list", context)
    except NotAuthorized:
        base.abort(403, _("Not authorized to see this page"))

    q = request.args.get("q", "")
    sort_by = request.args.get("sort")

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
        context["user_id"] = current_user.id  # type: ignore
        context["user_is_admin"] = current_user.sysadmin  # type: ignore

    try:
        data_dict_global_results: dict[str, Any] = {
            "all_fields": False,
            "q": q,
            "sort": sort_by,
            "type": group_type or "group",
        }
        global_results = _action("group_list")(context, data_dict_global_results)
    except ValidationError as e:
        if e.error_dict and e.error_dict.get("message"):
            msg: Any = e.error_dict["message"]
        else:
            msg = str(e)
        h.flash_error(msg)
        extra_vars["page"] = Page([], 0)
        extra_vars["group_type"] = group_type
        return base.render(
            _get_group_template("index_template", group_type), extra_vars
        )

    data_dict_page_results: dict[str, Any] = {
        "all_fields": True,
        "q": q,
        "sort": sort_by,
        "type": group_type or "group",
        "limit": items_per_page,
        "offset": items_per_page * (page - 1),
        "include_extras": True,
    }
    page_results = _action("group_list")(context, data_dict_page_results)

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
    return base.render(_get_group_template("index_template", group_type), extra_vars)


class CreateGroupView(MethodView):
    """Create group view"""

    def _prepare(self, data: Optional[dict[str, Any]] = None) -> Context:
        if data and "type" in data:
            group_type = data["type"]
        else:
            group_type = _guess_group_type()
        if data:
            data["type"] = group_type

        context = cast(
            Context,
            {
                "model": model,
                "session": model.Session,
                "user": current_user.name,
                "save": "save" in request.args,
                "parent": request.args.get("parent", None),
                "group_type": group_type,
            },
        )

        try:
            assert _check_access("group_create", context)
        except NotAuthorized:
            base.abort(403, _("Unauthorized to create a group"))

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
            base.abort(400, _("Integrity Error"))
        user = current_user.name
        data_dict["type"] = group_type or "group"
        data_dict["users"] = [{"name": user, "capacity": "admin"}]
        try:
            group = _action("group_create")(context, data_dict)
        except (NotFound, NotAuthorized):
            base.abort(404, _("Group not found"))
        except ValidationError as e:
            errors = e.error_dict
            error_summary = e.error_summary
            return self.get(
                group_type, is_organization, data_dict, errors, error_summary
            )

        return h.redirect_to(cast(str, group["type"]) + ".read", id=group["name"])

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

        if not data.get("image_url", "").startswith("http"):
            data.pop("image_url", None)
        errors = errors or {}
        error_summary = error_summary or {}
        extra_vars: dict[str, Any] = {
            "data": data,
            "errors": errors,
            "error_summary": error_summary,
            "action": "new",
            "group_type": group_type,
        }
        _setup_template_variables(context, data, group_type=group_type)
        form = base.render(_get_group_template("group_form", group_type), extra_vars)

        # TODO: Remove
        # ckan 2.9: Adding variables that were removed from c object for
        # compatibility with templates in existing extensions
        g.form = form

        extra_vars["form"] = form
        return base.render(_get_group_template("new_template", group_type), extra_vars)


class EditGroupView(MethodView):
    """Edit group view"""

    def _prepare(self, id: Optional[str]) -> Context:
        data_dict: dict[str, Any] = {"id": id, "include_datasets": False}

        context = cast(
            Context,
            {
                "model": model,
                "session": model.Session,
                "user": current_user.name,
                "save": "save" in request.args,
                "for_edit": True,
                "parent": request.args.get("parent", None),
                "id": id,
            },
        )

        try:
            _action("group_show")(context, data_dict)
            _check_access("group_update", context, {"id": id})
        except NotAuthorized:
            base.abort(403, _("Unauthorized to create a group"))
        except NotFound:
            base.abort(404, _("Group not found"))

        return context

    def post(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Union[Response, str]:
        log.error("EditGroupView.post")
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
            base.abort(400, _("Integrity Error"))
        data_dict["id"] = context["id"]
        context["allow_partial_update"] = True

        # Handle child groups that don't exist
        group_children = data_dict.get("children", [])

        if group_children:
            group_children = group_children.split(",") if group_children else []
            groups = logic.get_action("group_list")(context, {})
            invalid_groups = []

            for child in group_children:
                if child not in groups:
                    invalid_groups.append(child)

            if invalid_groups:
                error = {
                    "Children": "Invalid child group(s) - %s"
                    % ", ".join(invalid_groups)
                }
                errors = error
                error_summary = error

                return self.get(
                    id, group_type, is_organization, data_dict, errors, error_summary
                )

        try:
            group = _action("group_update")(context, data_dict)
            if id != group["name"]:
                _force_reindex(group)
        except (NotFound, NotAuthorized):
            base.abort(404, _("Group not found"))
        except ValidationError as e:
            errors = e.error_dict
            error_summary = e.error_summary
            assert id
            return self.get(
                id, group_type, is_organization, data_dict, errors, error_summary
            )
        return h.redirect_to(cast(str, group["type"]) + ".read", id=group["name"])

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
        data_dict: dict[str, Any] = {"id": id, "include_datasets": False}
        try:
            group_dict = _action("group_show")(context, data_dict)
        except (NotFound, NotAuthorized):
            base.abort(404, _("Group not found"))
        data = data or group_dict
        assert data is not None
        errors = errors or {}
        extra_vars: dict[str, Any] = {
            "data": data,
            "group_dict": group_dict,
            "errors": errors,
            "error_summary": error_summary,
            "action": "edit",
            "group_type": group_type,
        }

        _setup_template_variables(context, data, group_type=group_type)
        form = base.render(_get_group_template("group_form", group_type), extra_vars)

        # TODO: Remove
        # ckan 2.9: Adding variables that were removed from c object for
        # compatibility with templates in existing extensions
        g.grouptitle = group_dict.get("title")
        g.groupname = group_dict.get("name")
        g.data = data
        g.group_dict = group_dict

        extra_vars["form"] = form
        return base.render(_get_group_template("edit_template", group_type), extra_vars)


class DeleteGroupView(MethodView):
    """Delete group view"""

    def _prepare(self, id: Optional[str] = None) -> Context:
        context = cast(
            Context,
            {
                "model": model,
                "session": model.Session,
                "user": current_user.name,
            },
        )
        try:
            assert _check_access("group_delete", context, {"id": id})
        except NotAuthorized:
            base.abort(403, _("Unauthorized to delete group %s") % "")
        return context

    def post(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Response:
        set_org(is_organization)
        context = self._prepare(id)
        try:
            _action("group_delete")(context, {"id": id})
            group_label = h.humanize_entity_type(
                "group", group_type, "has been deleted"
            ) or _("Group")
            h.flash_notice(_("%s has been deleted.") % _(group_label))
        except NotAuthorized:
            base.abort(403, _("Unauthorized to delete group %s") % "")
        except NotFound:
            base.abort(404, _("Group not found"))
        except ValidationError as e:
            base.abort(403, _(e.error_dict["message"]))

        return h.redirect_to("{}.index".format(group_type))

    def get(
        self, group_type: str, is_organization: bool, id: Optional[str] = None
    ) -> Union[str, Response]:
        set_org(is_organization)
        context = self._prepare(id)
        group_dict = _action("group_show")(context, {"id": id})
        if "cancel" in request.args:
            return h.redirect_to("{}.edit".format(group_type), id=id)

        # TODO: Remove
        g.group_dict = group_dict
        extra_vars: dict[str, Any] = {
            "group_dict": group_dict,
            "group_type": group_type,
        }
        return base.render(_replace_group_org("group/confirm_delete.html"), extra_vars)


querytool_group = Blueprint(
    "querytool_group",
    __name__,
    url_prefix="/group",
    url_defaults={"group_type": "group", "is_organization": False},
)


def register_group_plugin_rules(blueprint: Blueprint) -> None:
    blueprint.add_url_rule(
        "/new",
        methods=["GET", "POST"],
        view_func=CreateGroupView.as_view(str("new")),
    )
    blueprint.add_url_rule("/edit/<id>", view_func=EditGroupView.as_view(str("edit")))
    blueprint.add_url_rule("/reports/<id>", endpoint="reports", methods=["GET"], view_func=read_reports)
    blueprint.add_url_rule(
        "/delete/<id>",
        methods=["GET", "POST"],
        view_func=DeleteGroupView.as_view(str("delete")),
    )


register_group_plugin_rules(querytool_group)
