from ckan.plugins import toolkit

from ckanext.querytool.logic import validators


not_missing = toolkit.get_validator('not_missing')
not_empty = toolkit.get_validator('not_empty')
package_id_exists = toolkit.get_validator('package_id_exists')
name_validator = toolkit.get_validator('name_validator')


def querytool_schema():
    return {
        'name': [not_empty,
                 name_validator,
                 validators.querytool_name_validator, unicode],
        'title': [],
        'description': []
    }
