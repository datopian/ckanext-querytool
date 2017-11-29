from ckanext.querytool.model import CkanextQueryTool


def create_query(context, data_dict):
    '''

    :param context:
    :param data_dict:
    :return:
    '''

    data = {
        'title': data_dict['title'],
        'description': data_dict['description']
    }
    query = CkanextQueryTool(**data)
    out = []
    result = query.save()
    out.append(result)

    return out
