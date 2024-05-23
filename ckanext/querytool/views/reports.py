import json
import ast

from flask import Blueprint
from ckan.plugins import toolkit as tk
import ckanext.querytool.helpers as h
from ckan.common import _, config, g, request
import logging
from urllib.parse import urlencode
from flask import Blueprint, request, redirect
from typing import Any, cast, List, Tuple, Optional

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, _, g, c, current_user
import ckan.lib.helpers as ckan_helpers
import ckan.lib.search as search

from ckan.types import Context

reports = Blueprint(
    "reports",
    __name__,
)


def reports_list():
    extra_vars = {"group_type": "group", "is_organization": False}
    q = request.args.get("q", "")
    sort_by = request.args.get("sort")
    reports = h.get_all_reports(q)

    extra_vars["q"] = q
    extra_vars["sort_by_selected"] = sort_by

    extra_vars.update(
        page={
            "_items": reports,
            "item_count": len(reports),
        }
    )
    return tk.render("report/index.html", extra_vars)


def querytool_edit(querytool=None, data=None, errors=None, error_summary=None):
    print("querytool_edit", flush=True)
    print(querytool, flush=True)
    print(data, flush=True)
    print(errors, flush=True)
    print(error_summary, flush=True)
    """
        Create/edit query tool

    :return: query create/edit template page

    """
    if querytool:
        querytool = querytool[1:]

    data_dict = {"name": querytool}

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

    _querytool = tk.get_action("querytool_get")(context, data_dict)
    user_type = (
        h.get_user_permission_type(current_user.name, _querytool.get("group"))
        if _querytool
        else []
    )

    if not current_user.name or (
        _querytool
        and user_type in ["member", None]
        and c.userobj.sysadmin is False
        and data_dict.get("name") != ""
    ):
        abort(403, _("Not authorized to see this page"))
    else:
        if user_type not in ["admin", "editor"] and data_dict.get("name") != "":
            try:
                tk.check_access("querytool_update", context, data_dict)
            except logic.NotAuthorized:
                abort(403, _("Not authorized to see this page"))

    # FIXME Had to comment out to make it work
    #    if _querytool is None and len(querytool) > 0:
    #        abort(404, _("Report not found."))

    if _querytool is None:
        _querytool = {}

    # Check if the data for this querytool still exists
    if "dataset_name" in list(_querytool.keys()):
        try:
            _get_action("package_show", {"id": _querytool["dataset_name"]})
        except NotFound:
            abort(
                404,
                _(
                    "The data used for creating this "
                    "report has been removed "
                    "by the administrator."
                ),
            )

    if tk.request.method == "POST" and not data:
        data = dict(tk.request.form)
        print(data, flush=True)

        group = ast.literal_eval(data["group"])
        data.pop("group")
        data["group"] = group["name"]

        filters = []
        y_axis_columns = []
        related_querytools = []
        for k, v in list(data.items()):

            if k.startswith("data_filter_name_"):
                filter = {}
                id = k.split("_")[-1]
                filter["order"] = int(id)
                filter["name"] = data["data_filter_name_{}".format(id)]
                filter["value"] = data["data_filter_value_{}".format(id)]
                # Replace & with %26 to fix the error for graphs
                # not being generated for values with & in them
                filter["value"] = filter["value"].replace("&", "%26")
                filter["alias"] = data["data_filter_alias_{}".format(id)]
                filter["visibility"] = data["data_filter_visibility_{}".format(id)]

                filters.append(filter)
            elif k.startswith("y_axis_name_"):
                id = k.split("_")[-1]
                alias = data.get("y_axis_alias_%s" % id, "")
                y_axis_columns.append({"name": v, "alias": alias})

            elif k.startswith("related_querytool_"):
                related_querytool = {}
                id = k.split("_")[-1]
                related_querytool["order"] = int(id)
                related_querytool["name"] = data["related_querytool_{}".format(id)]
                related_querytools.append(related_querytool)

        if any(filters):
            _querytool["filters"] = json.dumps(filters)
            sql_string = h.create_query_str(data["chart_resource"], filters)
        else:
            _querytool["filters"] = ""
            sql_string = ""

        if "private" not in list(data.keys()):
            _querytool["private"] = True

        if any(related_querytools):
            _querytool["related_querytools"] = json.dumps(related_querytools)
        else:
            _querytool["related_querytools"] = ""

        _querytool.update(data)
        _querytool["querytool"] = querytool
        _querytool["sql_string"] = sql_string
        _querytool["y_axis_columns"] = (
            json.dumps(y_axis_columns) if y_axis_columns else ""
        )
        _querytool["owner_org"] = data["owner_org"]
        _querytool["icon"] = data["icon"]
        _querytool["selection_label"] = data.get("selection_label")
        _querytool["report_caption"] = data.get("report_caption")
        _querytool["download_options"] = data.get("download_options")

        try:
            junk = tk.get_action("querytool_update")(context, _querytool)
            ckan_helpers.flash_success(_("Data Successfully updated."))
        except logic.ValidationError as e:
            errors = e.error_dict
            error_summary = e.error_summary
            return self.querytool_edit(
                "/" + querytool, _querytool, errors, error_summary
            )
        if "save_data" in list(data.keys()):
            # redirect to querytools group
            tk.redirect_to(
                "/" + ckan_helpers.lang() + "/group/" + _querytool["group"] + "/reports"
            )

        else:
            # redirect to manage visualisations
            url = h.url_for(
                "querytool_edit_visualizations", querytool="/" + _querytool["name"]
            )
            h.redirect_to(url)

    if not data:
        data = _querytool

    if "filters" in data and len(data["filters"]) > 0:
        data["filters"] = json.loads(data["filters"])
        data["filters"].sort(key=itemgetter("order"))

    if "related_querytools" in data and len(data["related_querytools"]) > 0:
        data["related_querytools"] = json.loads(data["related_querytools"])
        data["related_querytools"].sort(key=itemgetter("order"))

    if "chart_resource" in data:
        resource_fields = h.get_resource_columns(data["chart_resource"])
        c.active_filters = ",".join(resource_fields)
        c.resource_id = data["chart_resource"]

    errors = errors or {}
    error_summary = error_summary or {}

    if _querytool.get("y_axis_columns"):
        _querytool["y_axis_columns"] = h.parse_y_axis_columns(
            _querytool.get("y_axis_columns")
        )
        _querytool["y_axis_names"] = [
            column["name"] for column in _querytool["y_axis_columns"]
        ]

    vars = {
        "data": data,
        "errors": errors,
        "error_summary": error_summary,
        "querytool": _querytool,
    }

    return tk.render("querytool/admin/base_edit_data.html", extra_vars=vars)


def querytool_public_read(name):
    """
    :return: base template
    """
    querytool = _get_action("querytool_public_read", {"name": name})

    if not querytool:
        abort(404, _("Report not found."))

    # only sysadmins or organization members can access private querytool
    if querytool["private"] is True:
        context = _get_context()
        try:
            check_access("querytool_show", context, {"name": name})
        except NotAuthorized:
            abort(403, _("Not authorized to see this page"))

    # Check if the data for this querytool still exists
    if querytool["dataset_name"]:
        try:
            _get_action("package_show", {"id": querytool["dataset_name"]})
        except NotFound:
            abort(
                404,
                _(
                    "The data used for creating this "
                    "report has been removed "
                    "by the administrator."
                ),
            )

    if not querytool["visualizations"]:
        abort(404, _("Report not fully set."))

    params = tk.request.params

    parent = params.get("parent", None)
    parent_title = params.get("title", None)
    from_parent = params.get("from_parent", False)

    querytools = []
    items = []
    items.append({"order": 0, "name": querytool["name"]})

    if querytool["related_querytools"]:
        items.extend(json.loads(querytool["related_querytools"]))

    items.sort(key=itemgetter("order"))
    for item in items:

        q_item = _get_action("querytool_public_read", {"name": item["name"]})
        if q_item:
            q_item["visualizations"] = json.loads(q_item["visualizations"])
            q_item["visualizations"].sort(key=itemgetter("order"))

            q_name = q_item["name"]
            new_filters = json.loads(q_item["filters"])

            for k, v in list(params.items()):
                # Update query filters
                if k.startswith("{}_data_filter_name_".format(q_name)):
                    id = k.split("_")[-1]
                    for filter in new_filters:
                        # Apply changes only on public filters
                        # to protect changing private
                        # filters by changing the url query params
                        if filter["visibility"] == "public":
                            if v == filter.get("name"):
                                filter["value"] = params.get(
                                    "{}_data_filter_value_{}".format(q_name, id)
                                )
                            # Replace & with %26 to fix the error for graphs
                            # not being generated for values with & in them
                            filter["value"] = filter["value"].replace("&", "%26")
                # Update charts y_axis value
                if k.startswith("{}_y_axis_column".format(q_name)):
                    q_item["y_axis_column"] = v
                # Update visualizations filters
                if k.startswith("{}_viz_filter_name".format(q_name)):
                    id = k.split("_")[-1]
                    for visualization in q_item["visualizations"]:
                        if visualization["order"] == int(id):
                            visualization["filter_name"] = params.get(
                                "{}_viz_filter_name_{}".format(q_name, id)
                            )
                            visualization["filter_value"] = params.get(
                                "{}_viz_filter_value_{}".format(q_name, id)
                            )

            for image in q_item["visualizations"]:
                if image["type"] == "image":
                    is_upload = image["url"] and not image["url"].startswith("http")

                    if is_upload:
                        image["url"] = "{0}/uploads/vs/{1}".format(
                            tk.request.host_url, image["url"]
                        )

            # Default to first new filter after updating visualizations
            for vis in q_item.get("visualizations", []):
                resource_id = q_item.get("chart_resource")
                filter_name = vis.get("filter_name")
                visibility = vis.get("filter_visibility")
                filter_value = vis.get("filter_value")

                if resource_id and filter_name and visibility == "public":
                    updated_filters = h.get_filter_values(
                        resource_id, filter_name, new_filters
                    )

                    if (
                        filter_value
                        and filter_value not in updated_filters
                        and len(updated_filters) > 0
                    ):
                        vis["filter_value"] = updated_filters[0]

            related_sql_string = h.create_query_str(
                q_item.get("chart_resource"), new_filters
            )

            q_item["public_filters"] = new_filters
            q_item["public_filters"].sort(key=itemgetter("order"))
            q_item["sql_string"] = related_sql_string

            # Add slug to filters
            for filter in new_filters:
                filter["slug"] = h.slugify(filter.get("alias", ""))

            # Need this hack for chart filter
            q_item["public_main_filters"] = json.dumps(new_filters)

            querytools.append(q_item)

    embed = True if "embed" in params and params["embed"] == "true" else False

    extra_vars = {"querytools": querytools, "embed": embed}

    if parent and parent_title and from_parent:
        extra_vars["parent"] = parent
        extra_vars["parent_title"] = parent_title
        extra_vars["from_parent"] = from_parent

    return render("querytool/public/read.html", extra_vars=extra_vars)


reports.add_url_rule("/report", view_func=reports_list)
reports.add_url_rule(
    "/querytool/public/{name}", view_func=querytool_public_read, endpoint="public_read"
)
reports.add_url_rule(
    "/report/edit", view_func=querytool_edit, endpoint="edit", methods=["GET", "POST"]
)
