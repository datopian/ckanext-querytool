import io
from flask import Blueprint
import logging

from ckan.lib.base import render
from ckan.plugins import toolkit
import json
import flask

import ckanext.querytool.helpers as helpers
import ckanext.querytool.model as qmodel
import ckan.lib.base as base
import ckan.logic as logic
from ckan.plugins import toolkit as tk
from ckan.common import config, _, g, c, current_user
from typing import Any, cast, List, Tuple, Optional
from ckan.types import Context
import ckan.model as model
from operator import itemgetter

log = logging.getLogger(__name__)

_get_action = toolkit.get_action

abort = base.abort

querytool = Blueprint("querytool", __name__)


def public_list(group=None):
    """
    List all of the available query tools
    :return: querytool list template page
    """
    from_parent = toolkit.request.args.get("from_parent", False)
    parent_group_children = toolkit.request.args.get("parent_group_children", False)
    parent_title = toolkit.request.args.get("title", False)
    q = toolkit.request.args.get("report_q", "")

    if group == "__misc__group__":
        group = {
            "misc_group": True,
            "title": "Other",
            "description": "Miscellaneous groups",
            "name": "__misc__group__",
        }
        child_group_search_results = []

        if q:
            child_group_search_results = helpers.child_group_search(
                query_string=q, query_children=parent_group_children, misc_group=True
            )

        return render(
            "querytool/public/list.html",
            extra_vars={
                "child_groups": child_group_search_results,
                "group": group,
                "from_parent": True,
                "title": parent_title,
            },
        )

    group_details = _get_action("group_show")({}, {"id": group})

    if from_parent and parent_group_children:
        child_group_search_results = []

        if q:
            child_group_search_results = helpers.child_group_search(
                query_string=q, query_children=parent_group_children
            )

        return render(
            "querytool/public/list.html",
            extra_vars={
                "child_groups": child_group_search_results,
                "group": group_details,
                "from_parent": True,
                "title": parent_title,
            },
        )
    else:
        querytools = _get_action("querytool_public_list")({}, {"group": group})
        log.error(querytools)

        if q:
            querytool_search_results = helpers.querytool_search(
                query_string=q, query_group=group
            )
            querytool_search_results_names = [
                querytool.name for querytool in querytool_search_results
            ]
            querytools = [
                querytool
                for querytool in querytools
                if querytool["name"] in querytool_search_results_names
            ]

        if from_parent:
            extra_vars = {
                "data": querytools,
                "group": group_details,
                "from_parent": True,
                "title": parent_title,
            }
        else:
            extra_vars = {"data": querytools, "group": group_details}
        return render("querytool/public/list.html", extra_vars=extra_vars)


def querytool_public_reports():
    """
    Lists all available groups
    :return: base template
    """
    parent_name = toolkit.request.params.get("parent")
    q = toolkit.request.params.get("report_q", "")
    extra_vars = {}

    if parent_name == "__misc__group__":
        misc_groups = _get_action("get_available_groups", {})
        misc_groups = ",".join(
            [
                group["name"]
                for group in misc_groups
                if group["group_relationship_type"] != "parent"
            ]
        )
        querytool_search_results = qmodel.child_group_report_search(
            query_string=q, query_children=misc_groups
        )
        querytools = [querytool for querytool in querytool_search_results]
        extra_vars["parent"] = parent_name

    elif parent_name:
        parent_group = _get_action("group_show")({}, {"id": parent_name})
        children_names = parent_group.get("children")

        querytool_search_results = qmodel.child_group_report_search(
            query_string=q, query_children=children_names
        )
        querytools = [querytool for querytool in querytool_search_results]

    else:
        groups = helpers.get_groups()

        querytools = _get_action("querytool_list_other")({}, {"groups": groups})

        if q:
            querytool_search_results = helpers.querytool_search(query_string=q)
            querytool_search_results_names = [
                querytool.name for querytool in querytool_search_results
            ]
            querytools = [
                querytool
                for querytool in querytools
                if querytool["name"] in querytool_search_results_names
            ]

    extra_vars["data"] = querytools

    return render("querytool/public/reports.html", extra_vars=extra_vars)

def querytool_public_read(name):
    '''
    :return: base template
    '''
    querytool = _get_action('querytool_public_read')({}, {'name': name})

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

    if not querytool:
        abort(404, _('Not found'))

    # only sysadmins or organization members can access private querytool
    if querytool['private'] is True:
        try:
            tk.check_access('querytool_show', context, {'name': name})
        except logic.NotAuthorized:
            abort(403, _('Not authorized to see this page'))

    # Check if the data for this querytool still exists
    if querytool['dataset_name']:
        try:
            print("DATASET NAME", flush=True)
            print(querytool['dataset_name'], flush=True)
            _get_action('package_show')(context, {'id': querytool['dataset_name']})
        except logic.NotFound:
            abort(404, _('The data used for creating this '
                         'report has been removed '
                         'by the administrator.'))

    if not querytool['visualizations']:
        abort(404, _('Report not fully set.'))

    params = toolkit.request.params

    parent = params.get('parent', None)
    parent_title = params.get('title', None)
    from_parent = params.get('from_parent', False)

    querytools = []
    items = []
    items.append({'order': 0, 'name': querytool['name']})

    if querytool['related_querytools']:
        items.extend(json.loads(querytool['related_querytools']))

    items.sort(key=itemgetter('order'))
    for item in items:

        q_item = _get_action(
            'querytool_public_read')(context ,
            {'name': item['name']}
        )
        if q_item:
            q_item['visualizations'] = json.loads(
                q_item['visualizations']
            )
            q_item['visualizations'].sort(key=itemgetter('order'))

            q_name = q_item['name']
            new_filters = json.loads(q_item['filters'])

            for k, v in list(params.items()):
                # Update query filters
                if k.startswith('{}_data_filter_name_'.format(q_name)):
                    id = k.split('_')[-1]
                    for filter in new_filters:
                        # Apply changes only on public filters
                        # to protect changing private
                        # filters by changing the url query params
                        if filter['visibility'] == 'public':
                            if v == filter.get('name'):
                                filter['value'] = \
                                    params.get('{}_data_filter_value_{}'
                                               .format(q_name, id))
                            # Replace & with %26 to fix the error for graphs
                            # not being generated for values with & in them
                            filter['value'] = filter['value'].replace('&','%26')
                # Update charts y_axis value
                if k.startswith('{}_y_axis_column'.format(q_name)):
                    q_item['y_axis_column'] = v
                # Update visualizations filters
                if k.startswith('{}_viz_filter_name'.format(q_name)):
                    id = k.split('_')[-1]
                    for visualization in q_item['visualizations']:
                        if visualization['order'] == int(id):
                            visualization['filter_name'] = \
                                params.get('{}_viz_filter_name_{}'.
                                           format(q_name, id))
                            visualization['filter_value'] = \
                                params.get('{}_viz_filter_value_{}'.
                                           format(q_name, id))

            for image in q_item['visualizations']:
                if image['type'] == 'image':
                    is_upload = image['url'] and not image[
                        'url'].startswith('http')

                    if is_upload:
                        image['url'] = '{0}/uploads/vs/{1}'.format(
                            toolkit.request.host_url, image['url'])

            # Default to first new filter after updating visualizations
            for vis in q_item.get('visualizations', []):
                resource_id = q_item.get('chart_resource')
                filter_name = vis.get('filter_name')
                visibility = vis.get('filter_visibility')
                filter_value = vis.get('filter_value')

                if resource_id and filter_name and \
                   visibility == 'public':
                    updated_filters = helpers.get_filter_values(
                        resource_id, filter_name, new_filters
                    )

                    if filter_value and filter_value not in \
                       updated_filters and len(updated_filters) > 0:
                        vis['filter_value'] = updated_filters[0]

            related_sql_string = helpers.create_query_str(
                q_item.get('chart_resource'),
                new_filters
            )

            q_item['public_filters'] = new_filters
            q_item['public_filters'].sort(key=itemgetter('order'))
            q_item['sql_string'] = related_sql_string

            # Add slug to filters
            for filter in new_filters:
                filter['slug'] = helpers.slugify(filter.get('alias', ''))

            # Need this hack for chart filter
            q_item['public_main_filters'] = json.dumps(new_filters)

            querytools.append(q_item)

    embed = True if 'embed' in params and params['embed'] == 'true' else False

    extra_vars = {
        'querytools': querytools,
        'embed': embed
    }

    if parent and parent_title and from_parent:
        extra_vars['parent'] = parent
        extra_vars['parent_title'] = parent_title
        extra_vars['from_parent'] = from_parent

    return render(
        'querytool/public/read.html',
        extra_vars=extra_vars
    )



def querytool_public_read(name):
    """
    :return: base template
    """
    querytool = _get_action("querytool_public_read")({}, {"name": name})

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

    if not querytool:
        abort(404, _("Not found"))

    # only sysadmins or organization members can access private querytool
    if querytool["private"] is True:
        try:
            tk.check_access("querytool_show", context, {"name": name})
        except logic.NotAuthorized:
            abort(403, _("Not authorized to see this page"))

    # Check if the data for this querytool still exists
    if querytool["dataset_name"]:
        try:
            print("DATASET NAME", flush=True)
            print(querytool["dataset_name"], flush=True)
            _get_action("package_show")(context, {"id": querytool["dataset_name"]})
        except logic.NotFound:
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

    params = toolkit.request.params

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
        q_item = _get_action("querytool_public_read")(context, {"name": item["name"]})
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
                            toolkit.request.host_url, image["url"]
                        )

            # Default to first new filter after updating visualizations
            for vis in q_item.get("visualizations", []):
                resource_id = q_item.get("chart_resource")
                filter_name = vis.get("filter_name")
                visibility = vis.get("filter_visibility")
                filter_value = vis.get("filter_value")

                if resource_id and filter_name and visibility == "public":
                    updated_filters = helpers.get_filter_values(
                        resource_id, filter_name, new_filters
                    )

                    if (
                        filter_value
                        and filter_value not in updated_filters
                        and len(updated_filters) > 0
                    ):
                        vis["filter_value"] = updated_filters[0]

            related_sql_string = helpers.create_query_str(
                q_item.get("chart_resource"), new_filters
            )

            q_item["public_filters"] = new_filters
            q_item["public_filters"].sort(key=itemgetter("order"))
            q_item["sql_string"] = related_sql_string

            # Add slug to filters
            for filter in new_filters:
                filter["slug"] = helpers.slugify(filter.get("alias", ""))

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


def querytool_download_data(name):
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
    file_format = toolkit.request.args.get("format", "csv")
    sql_string = toolkit.request.args.get("sql_string", None)

    data_dict = {"sql_string": sql_string, "format": file_format}

    resp = _get_action("querytool_download_data")(context, data_dict)
    print("RESPONSE", flush=True)
    print(resp, flush=True)

    resp_formats = {
        "csv": "text/csv",
        "json": "application/json",
        "xml": "application/xml",
        "xlsx": "application/vnd.openxmlformats-officedocument" ".spreadsheetml.sheet",
    }

    resp_format = resp_formats[file_format]

    file_name = name + '.' + file_format

    mem = io.BytesIO()
    if file_format == "xlsx":
        return flask.send_file(
            resp,
            mimetype=resp_format,
            as_attachment=True,
            attachment_filename=file_name,
        )

    mem.write(resp.getvalue().encode())
    # seeking was necessary. Python 3.5.2, Flask 0.12.2
    mem.seek(0)
    resp.close()

    return flask.send_file(
        mem,
        mimetype=resp_format,
        as_attachment=True,
        attachment_filename=file_name,
    )


def register_querytool_plugin_rules(blueprint):
    """
    Register the querytool plugin rules
    :param blueprint: The querytool blueprint
    """
    blueprint.add_url_rule("/querytool/public/group/<group>", view_func=public_list)
    blueprint.add_url_rule(
        "/querytool/public/group/__misc__groups__", view_func=public_list
    )
    blueprint.add_url_rule(
        "/querytool/public/reports", view_func=querytool_public_reports
    )
    blueprint.add_url_rule(
        "/querytool/public/<name>",
        view_func=querytool_public_read,
        methods=["GET"],
    )
    blueprint.add_url_rule(
        "/querytool/download/<name>",
        view_func=querytool_download_data,
        methods=["GET"],
    )


register_querytool_plugin_rules(querytool)
