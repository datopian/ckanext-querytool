from flask import Blueprint
from ckan.plugins import toolkit as tk
import ckanext.querytool.helpers as h
from ckan.common import _, config, g, request

reports = Blueprint(
    "reports",
    __name__,
    url_defaults={"group_type": "group", "is_organization": False},
)


def reports_list(group_type: str, is_organization: bool):
    extra_vars = {"group_type": group_type, "is_organization": is_organization}
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


reports.add_url_rule("/report", view_func=reports_list)
