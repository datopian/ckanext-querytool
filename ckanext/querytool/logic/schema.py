import logging

from ckan.plugins import toolkit

from ckanext.querytool.logic import validators


not_missing = toolkit.get_validator("not_missing")
not_empty = toolkit.get_validator("not_empty")
ignore_missing = toolkit.get_validator("ignore_missing")
package_id_exists = toolkit.get_validator("package_id_exists")
name_validator = toolkit.get_validator("name_validator")
isodate = toolkit.get_validator("isodate")
boolean_validator = toolkit.get_validator("boolean_validator")
unicode_safe = toolkit.get_validator("unicode_safe")


log = logging.getLogger(__name__)


def querytool_schema():
    return {
        "name": [
            not_empty,
            name_validator,
            validators.querytool_name_validator,
            unicode_safe,
        ],
        "title": [not_empty, unicode_safe],
        "dataset_name": [not_empty, unicode_safe],
        "private": [ignore_missing, boolean_validator],
        "type": [not_empty, unicode_safe],
        "group": [not_empty, unicode_safe],
        "owner_org": [not_empty, unicode_safe],
        "description": [
            ignore_missing,
            unicode_safe,
            validators.description_length_validator,
        ],
        "filters": [not_missing, not_empty, unicode_safe],
        "sql_string": [ignore_missing, unicode_safe],
        "related_querytools": [ignore_missing, unicode_safe],
        "created": [ignore_missing, isodate],
        "modified": [ignore_missing, isodate],
        "chart_resource": [not_empty, unicode_safe],
        "y_axis_columns": [not_empty, unicode_safe],
        "icon": [ignore_missing, unicode_safe],
        "additional_description": [ignore_missing, unicode_safe],
        "image_url": [ignore_missing, unicode_safe],
        "selection_label": [ignore_missing, unicode_safe],
        "report_caption": [ignore_missing, unicode_safe],
        "download_options": [ignore_missing, boolean_validator],
    }
