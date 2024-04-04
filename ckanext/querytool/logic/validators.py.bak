import logging
from itertools import count

import ckan.plugins as p
import ckan.lib.navl.dictization_functions as df

from ckanext.querytool.model import CkanextQueryTool
from ckan.common import _

log = logging.getLogger(__name__)

Invalid = df.Invalid

DESCRIPTION_MAX_LENGTH = 500


def querytool_name_validator(key, data, errors, context):
    session = context['session']
    querytool_name = context.get('querytool')

    if querytool_name and querytool_name == data[key]:
        return

    query = session.query(CkanextQueryTool.name).filter_by(name=data[key])

    result = query.first()

    if result:
        errors[key].append(
            p.toolkit._('This report name already exists. '
                        'Choose another.'))


def description_length_validator(description, context):
    if len(description) > DESCRIPTION_MAX_LENGTH:
        raise Invalid(_('Description must be at maximum %s characters long') %
            DESCRIPTION_MAX_LENGTH)

    return description


def group_children_string_convert(key, data, errors, context):
    '''Takes a list of children groups that is a comma-separated string (in data[key])
    and parses tag names. These are added to the data dict, enumerated. They
    are also validated.'''

    if isinstance(data[key], basestring):
        children = [
            child.strip()
            for child in data[key].split(',')
            if child.strip()
        ]
    else:
        children = data[key]

    current_index = max([
        int(k[1]) for k in data.keys()
        if len(k) == 3 and k[0] == 'children'
    ] + [-1])

    for num, child in zip(count(current_index + 1), children):
        data[('children', num, 'name')] = child

    return data
