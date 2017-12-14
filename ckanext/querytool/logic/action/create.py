from ckanext.querytool.model import CkanextQueryTool


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

    data = {
        'title': data_dict['title'],
        'description': data_dict['description'],
        'name' : data_dict['name']
    }
    query = CkanextQueryTool.get(name=data_dict['name'])
    result = {}
    print query
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
