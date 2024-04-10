import logging

from ckan.plugins import toolkit

from ckanext.querytool.logic import validators


not_missing = toolkit.get_validator('not_missing')
not_empty = toolkit.get_validator('not_empty')
ignore_missing = toolkit.get_validator('ignore_missing')
package_id_exists = toolkit.get_validator('package_id_exists')
name_validator = toolkit.get_validator('name_validator')
isodate = toolkit.get_validator('isodate')
boolean_validator = toolkit.get_validator('boolean_validator')


log = logging.getLogger(__name__)


def querytool_schema():
    return {
        'name': [not_empty,
                 name_validator,
                 validators.querytool_name_validator,
                 str],
        'title': [not_empty, str],
        'dataset_name': [not_empty, str],
        'private': [ignore_missing, boolean_validator],
        'type': [not_empty, str],
        'group': [not_empty, str],
        'owner_org': [not_empty, str],
        'description': [ignore_missing, str, validators.description_length_validator],
        'filters': [not_missing, not_empty, str],
        'sql_string': [ignore_missing, str],
        'related_querytools': [ignore_missing, str],
        'created': [ignore_missing, isodate],
        'modified': [ignore_missing, isodate],
        'chart_resource': [not_empty, str],
        'y_axis_columns': [not_empty, str],
        'icon': [ignore_missing, str],
        'additional_description': [ignore_missing, str],
        'image_url': [ignore_missing, str],
        'selection_label': [ignore_missing, str],
        'report_caption': [ignore_missing, str],
        'download_options': [ignore_missing, boolean_validator],
    }
