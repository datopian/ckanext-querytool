from flask import Blueprint
import logging

from ckan.lib.base import render
from ckan.plugins import toolkit

import ckanext.querytool.helpers as helpers
import ckanext.querytool.model as qmodel

log = logging.getLogger(__name__)

_get_action = toolkit.get_action


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
        querytools = _get_action('querytool_public_list')({}, {'group': group})
        log.error(querytools)

        if q:
           querytool_search_results = helpers.querytool_search(
               query_string=q, query_group=group
           )
           querytool_search_results_names = [
               querytool.name for querytool in querytool_search_results
           ]
           querytools = [
               querytool for querytool in querytools if
               querytool['name'] in querytool_search_results_names
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


register_querytool_plugin_rules(querytool)
