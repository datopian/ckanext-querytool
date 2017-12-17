from ckan.plugins import toolkit

from ckanext.querytool.logic import validators


not_missing = toolkit.get_validator('not_missing')
not_empty = toolkit.get_validator('not_empty')
package_id_exists = toolkit.get_validator('package_id_exists')


def querytool_create_schema():
    return {
        'name': [not_empty, unicode],
        'title': [],
        'description': []
    }