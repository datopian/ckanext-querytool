import datetime

import ckan.logic as logic
import ckan.lib.navl.dictization_functions as df
from ckan.plugins import toolkit

from ckanext.querytool.logic import schema
from ckanext.querytool.model import CkanextQueryTool, table_dictize,\
                                    CkanextQueryToolVisualizations

check_access = logic.check_access


def querytool_update(context, data_dict):
    '''
        Create new query tool
    :param title
    :param description
    :param dataset
    :param filters
    :param created
    '''

    check_access('querytool_update', context)

    # we need the querytool name in the context for name validation
    context['querytool'] = data_dict['querytool']
    session = context['session']
    data, errors = df.validate(data_dict, schema.querytool_schema(),
                               context)

    if errors:
        raise toolkit.ValidationError(errors)

    querytool = CkanextQueryTool.get(name=data_dict['querytool'])

    if not querytool:
        querytool = CkanextQueryTool()

    items = ['title', 'description', 'name', 'dataset_name', 'filters']
    for item in items:
        setattr(querytool, item, data.get(item))

    querytool.modified = datetime.datetime.utcnow()
    querytool.save()
    session.add(querytool)
    session.commit()


def querytool_visualizations_update(context, data_dict):
    '''
        Create new query tool visualizations
    :param
    :param
    :param
    '''

    # check_access('querytool_update', context)

    # we need the querytool name in the context for name validation
    # context['querytool'] = data_dict['querytool']
    session = context['session']
    # data, errors = df.validate(data_dict, schema.querytool_schema(),
    #                          context)

    # if errors:
    #    raise toolkit.ValidationError(errors)
    print 'XXX', data_dict['name']
    visualizations = \
        CkanextQueryToolVisualizations.get(name=data_dict['name'])

    if not visualizations:
        visualizations = CkanextQueryToolVisualizations()

    visualizations.name = data_dict['name']

    visualizations.save()
    session.add(visualizations)
    session.commit()
