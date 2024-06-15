import logging
import json
from operator import itemgetter

import ckan.model as m
from ckan.common import c
from ckan.plugins import toolkit
import ckan.logic as logic
import ckan.authz as authz
from ckanext.querytool.model import (
    CkanextQueryTool,
    table_dictize,
    CkanextQueryToolVisualizations,
)
import ckanext.querytool.helpers as h
import ckan.lib.helpers as ch
from ckanext.querytool.lib.file_writer_service import FileWriterService

log = logging.getLogger(__name__)

_check_access = logic.check_access
NotFound = logic.NotFound
_get_or_bust = logic.get_or_bust


def _get_context():
    return {
        "model": m,
        "session": m.Session,
        "user": c.user or c.author,
        "auth_user_obj": c.userobj,
    }


@toolkit.side_effect_free
def querytool_list_by_group(context, data_dict):
    """Returns a list of query tools that
     belong to a specified group.
    :rtype: list of dictionaries
    """

    # check_access('',
    #            context, data_dict)
    group = data_dict.get("group")

    # get a user's organizations:
    user_orgs = ch.organizations_available("read")
    querytools = []

    if c.userobj is not None:
        if c.userobj.sysadmin is not None:
            querytools += CkanextQueryTool.search(group=group)
        else:
            for org in user_orgs:
                querytools += CkanextQueryTool.search(group=group, owner_org=org["id"])
    else:
        querytools += CkanextQueryTool.search(group=group, private=False)

    out = []

    for querytool in querytools:
        querytool = table_dictize(querytool, context)
        out.append(querytool)

    return out


@toolkit.side_effect_free
def querytool_list_other(context, data_dict):
    """Returns a list of query tools that
     don't belong to any of the existing groups.
    :rtype: list of dictionaries
    """
    groups = data_dict.get("groups")
    querytools = CkanextQueryTool.search()
    out = []

    for querytool in querytools:
        if querytool.group not in groups:
            querytool = table_dictize(querytool, context)
            ch.user_in_org_or_group(querytool.get("owner_org"))
            out.append(querytool)
    return out


@toolkit.side_effect_free
def querytool_public_list(context, data_dict):
    """Returns a list of all query tools
    which are fully set.
    :rtype: list of dictionaries
    """
    group = data_dict.get("group")

    session = context["session"]

    # TODO: Fix this when visualizations are added
    # query = session.query(CkanextQueryTool, CkanextQueryToolVisualizations) \
    #    .join((CkanextQueryToolVisualizations, CkanextQueryTool.id ==
    #           CkanextQueryToolVisualizations.ckanext_querytool_id)) \
    #    .filter(CkanextQueryTool.group == group) \
    #    .filter(CkanextQueryTool.type == 'main') \
    #    .filter(CkanextQueryToolVisualizations.visualizations != '')
    query = (
        session.query(CkanextQueryTool)
        .filter(CkanextQueryTool.group == group)
        .filter(CkanextQueryTool.type == "main")
    )

    result = query.all()
    querytools_list = []

    if result and len(result) > 0:
        for item in result:
            querytool = table_dictize(item, context)
            querytools_list.append(querytool)
    return querytools_list


@toolkit.side_effect_free
def querytool_get(context, data_dict):
    """Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    """

    # check_access('',
    #            context, data_dict)

    # log.info('Querytool : %r', data_dict)
    name = data_dict["name"]

    querytool = CkanextQueryTool.get(name=name)
    if querytool:
        querytool = table_dictize(querytool, context)

    return querytool


@toolkit.side_effect_free
def querytool_get_visualizations(context, data_dict):
    """Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    """

    # check_access('',
    #            context, data_dict)

    # log.info('Querytool visualizations: %r', data_dict)
    name = data_dict["name"]
    visualizations = CkanextQueryToolVisualizations.get(name=name)
    if visualizations:
        visualizations = table_dictize(visualizations, context)

    return visualizations


@toolkit.side_effect_free
def querytool_public_read(context, data_dict):
    """Returns  query tool.
    :param name: querytool name
    :rtype: query tool object
    """

    # check_access('',
    #            context, data_dict)
    session = context["session"]
    name = data_dict["name"]

    query = (
        session.query(CkanextQueryTool, CkanextQueryToolVisualizations)
        .join(
            (
                CkanextQueryToolVisualizations,
                CkanextQueryTool.id
                == CkanextQueryToolVisualizations.ckanext_querytool_id,
            )
        )
        .filter(CkanextQueryToolVisualizations.name == name)
    )

    result = query.first()
    querytool = {}

    if result and len(result) > 0:
        for item in result:
            querytool.update(table_dictize(item, context))
    return querytool


def get_resource_fields(context, data_dict):
    """Returns sorted list of text and time fields of a datastore resource."""

    resource = data_dict.pop("resource")

    return ch.resource_view_get_fields(resource)


@toolkit.side_effect_free
def get_filter_values(context, data_dict):

    resource_id = data_dict.pop("resource_id")
    filter_name = data_dict.pop("filter_name")
    previous_filters = json.loads(data_dict.pop("previous_filters"))

    return h.get_filter_values(resource_id, filter_name, previous_filters)


@toolkit.side_effect_free
def querytool_get_resource_data(context, data_dict):
    sql_string = data_dict.get("sql_string")
    # Replace %26(&) with &\'||\' to get the sql_query
    # to work for ampersand in it
    sql_string = sql_string.replace("%26", "&'||'")
    return h.get_resource_data(sql_string)


@toolkit.side_effect_free
def querytool_get_chart_data(context, data_dict):
    category = data_dict.get("category")
    sql_string = data_dict.get("sql_string")
    x_axis = data_dict.get("x_axis")
    y_axis = data_dict.get("y_axis")
    upper_bounds = data_dict.get("upper_bounds")
    lower_bounds = data_dict.get("lower_bounds")
    chart_type = data_dict.get("chart_type")
    previous_filters = json.loads(data_dict.pop("previous_filters"))
    chart_filter = json.loads(data_dict.get("chart_filter"))
    resource_id = data_dict.get("resource_id").strip()
    sql_without_group = sql_string.split("GROUP BY")[0]
    sql_group = sql_string.split("GROUP BY")[1]
    categories_data = {}
    log.error(data_dict)

    if chart_filter:
        previous_filters.append(chart_filter)

    if category:
        x = []
        x.append("x")
        values = []
        static_reference_values = []

        category_values = sorted(
            h.get_filter_values(resource_id, category, previous_filters)
        )
        x_axis_values = sorted(
            h.get_filter_values(resource_id, x_axis, previous_filters)
        )

        for x_value in x_axis_values:
            categories_data[x_value] = []
            categories_data[x_value].append(x_value)

        for value in category_values:
            category_value_sql = (
                sql_without_group
                + 'AND ("'
                + category
                + '" = '
                + "'"
                + value
                + "'"
                + ") "
                + "GROUP BY"
                + sql_group
            )

            records = h.get_resource_data(category_value_sql)
            x.append(value)

            for record in records:
                if (
                    upper_bounds
                    and lower_bounds
                    and record.get(upper_bounds.lower())
                    and record.get(upper_bounds.lower())
                ):
                    upper_bound_value = record.get(upper_bounds.lower())

                    categories_data.setdefault(upper_bounds.lower(), {}).setdefault(
                        record[x_axis.lower()], []
                    ).append(upper_bound_value)

                    lower_bound_value = record.get(lower_bounds.lower())

                    categories_data.setdefault(lower_bounds.lower(), {}).setdefault(
                        record[x_axis.lower()], []
                    ).append(lower_bound_value)

                value = record[y_axis.lower()]
                categories_data[record[x_axis.lower()]].append(value)
                try:
                    value = float(value)
                    values.append(value)
                except Exception:
                    pass
                if "static_reference_column" in record:
                    try:
                        sr_value = float(record["static_reference_column"])
                        static_reference_values.append(sr_value)
                    except Exception:
                        pass

        if values:
            categories_data["y_axis_max"] = max(values)
            categories_data["y_axis_avg"] = sum(values) / len(values)
            categories_data["y_axis_min"] = min(values)

        if static_reference_values:
            categories_data["static_reference_value"] = sum(
                static_reference_values
            ) / len(static_reference_values)

        categories_data["x"] = x
        return categories_data
    else:
        return h.get_resource_data(sql_string)


@toolkit.side_effect_free
def querytool_get_resource_columns(context, data_dict):
    return h.get_resource_columns(data_dict.get("res_id"))


@toolkit.side_effect_free
def querytool_get_numeric_resource_columns(context, data_dict):
    return h.get_numeric_resource_columns(data_dict.get("res_id"))


@toolkit.side_effect_free
def querytool_get_table_columns(context, data_dict):
    """
    Return resource columns in key/value pair format as Datatables expect
    :param context:
    :param data_dict:
    :return:
    """
    columns = h.get_resource_columns(data_dict.get("res_id"))
    table_columns = []
    for column in columns:
        table_columns.append({"data": column, "title": column})
    return table_columns


@toolkit.side_effect_free
def querytool_download_data(context, data_dict):
    sql_string = data_dict.get("sql_string")
    data_format = data_dict.get("format")

    response = toolkit.get_action("datastore_search_sql")({}, {"sql": sql_string})

    records = response["records"]
    fields = response["fields"]

    # remove _full_text from datastore results
    fields[:] = [d for d in fields if d.get("id") != "_full_text"]

    writer = FileWriterService()
    stream = writer.write_to_file(fields, records, data_format, "comma")
    return stream.getvalue()


@toolkit.side_effect_free
def get_available_querytools(context, data_dict):

    selected_query = data_dict.get("exclude", [])
    selected_query = [q for q in selected_query if q not in ["", "<application>"]]
    session = m.Session

    # TODO: Fix this when visualizations are added
    #query = (
    #    session.query(CkanextQueryTool, CkanextQueryToolVisualizations)
    #    .join(
    #        (
    #            CkanextQueryToolVisualizations,
    #            CkanextQueryTool.id
    #            == CkanextQueryToolVisualizations.ckanext_querytool_id,
    #        )
    #    )
    #    .filter(CkanextQueryTool.type == "related")
    #    .filter(CkanextQueryToolVisualizations.visualizations != "")
    #)
    query = session.query(CkanextQueryTool).filter(CkanextQueryTool.type == "related")

    result = query.all()
    querytools_list = []

    if result and len(result) > 0:
        #for item in result:
        #    querytool = {}
        #    for _ in item:
        #        querytool.update(table_dictize(_, _get_context()))
        #    if querytool["name"] not in selected_query:
        #        querytools_list.append(querytool)
        for item in result:
            querytool = table_dictize(item, context)
            if querytool["name"] not in selected_query:
                querytools_list.append(querytool)
    return querytools_list


@toolkit.side_effect_free
def querytool_get_geojson_properties(context, data_dict):
    map_resource_url = data_dict.get("map_resource")

    return h.get_geojson_properties(map_resource_url)


@toolkit.side_effect_free
def querytool_get_map_data(context, data_dict):

    geojson_url = data_dict.get("geojson_url")
    map_key_field = data_dict.get("map_key_field")
    data_key_field = data_dict.get("data_key_field")
    data_value_field = data_dict.get("data_value_field")
    sql_string = data_dict.get("sql_string")

    return h.get_map_data(
        geojson_url, map_key_field, data_key_field, data_value_field, sql_string
    )


def member_list(context, data_dict=None, permissions_check=None):
    """Return the members of a group.
    The user must have permission to 'get' the group.
    :param id: the id or name of the group
    :type id: string
    :param object_type: restrict the members returned to those of a given type,
      e.g. ``'user'`` or ``'package'`` (optional, default: ``None``)
    :type object_type: string
    :param capacity: restrict the members returned to those with a given
      capacity, e.g. ``'member'``, ``'editor'``, ``'admin'``, ``'public'``,
      ``'private'`` (optional, default: ``None``)
    :type capacity: string
    :rtype: list of (id, type, capacity) tuples
    :raises: :class:`ckan.logic.NotFound`: if the group doesn't exist
    """
    model = context["model"]

    group = model.Group.get(_get_or_bust(data_dict, "id"))
    if not group:
        raise NotFound

    obj_type = data_dict.get("object_type", None)
    capacity = data_dict.get("capacity", None)

    # User must be able to update the group to remove a member from it
    _check_access("group_show", context, data_dict)

    q = (
        model.Session.query(model.Member)
        .filter(model.Member.group_id == group.id)
        .filter(model.Member.state == "active")
    )

    if obj_type:
        q = q.filter(model.Member.table_name == obj_type)
    if capacity:
        q = q.filter(model.Member.capacity == capacity)

    trans = authz.roles_trans()

    def translated_capacity(capacity):
        if permissions_check:
            return capacity.lower()
        try:
            return trans[capacity]
        except KeyError:
            return capacity

    return [
        (m.table_id, m.table_name, translated_capacity(m.capacity)) for m in q.all()
    ]


@toolkit.side_effect_free
def get_available_groups(context, data_dict):
    """
    Return all groups that don't have a parent or chilren
    :param context:
    :param data_dict:
    :return:
    """
    groups = toolkit.get_action("group_list")({}, {})

    available_groups = []

    for group_name in groups:
        group = toolkit.get_action("group_show")(
            {}, {"id": group_name, "include_extras": True, "all_fields": True}
        )

        if not group.get("parent"):
            available_groups.append(
                {
                    "name": group.get("name"),
                    "title": group.get("title"),
                    "parent": group.get("parent"),
                    "children": group.get("children"),
                    "group_relationship_type": group.get("group_relationship_type"),
                }
            )

    return available_groups


@toolkit.side_effect_free
def get_all_parent_groups(context, data_dict):
    """
    Return all groups that have children
    :param context:
    :param data_dict:
    :return:
    """
    groups = toolkit.get_action("group_list")({}, {})

    parent_groups = []

    for group_name in groups:
        group = toolkit.get_action("group_show")(
            {}, {"id": group_name, "include_extras": True, "all_fields": True}
        )

        if group.get("group_relationship_type") == "parent":
            parent_groups.append(group)

    return parent_groups


@toolkit.side_effect_free
def get_group_children(context, data_dict):
    """
    Return children of a group
    :param context:
    :param data_dict:
    :return:
    """
    group_name = data_dict.get("id")

    group = toolkit.get_action("group_show")(
        {}, {"id": group_name, "include_extras": True, "all_fields": True}
    )

    children_string = group.get("children")
    group_children = []

    if children_string:
        children = children_string.split(",")

        for child_name in children:
            child = toolkit.get_action("group_show")(
                {}, {"id": child_name, "include_extras": True, "all_fields": True}
            )

            if child:
                group_children.append(child)

    return group_children
