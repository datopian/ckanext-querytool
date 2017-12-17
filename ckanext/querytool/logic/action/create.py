from ckanext.querytool.model import CkanextQueryTool
import ckan.logic as logic
import ckan.lib.navl.dictization_functions as df
from ckan.plugins import toolkit
from ckanext.querytool.logic import schema

check_access = logic.check_access


def querytool_create(context, data_dict):
    '''
        Create new query tool
    :param context:
    :param title:
    :param description:
    :param name:
    :return: newly created query
    :rtype dictionary
    '''

    check_access('querytool_create', context)
    data, errors = df.validate(data_dict, schema.querytool_create_schema(),
                               context)

    if errors:
        raise toolkit.ValidationError(errors)
    title = data.get('title')
    description = data.get('description')
    name = data.get('name')

    data = {
        'title': title,
        'description': description,
        'name': name,
    }

    query = CkanextQueryTool.get(name=data['name'])
    result = {}

    if query is None:
        query = CkanextQueryTool(**data)
        query.save()
    else:
        query.title = data['title']
        query.description = data['description']
        query.name = data['name']
        result = query.commit()

    out = []
    out.append(result)

    return out
