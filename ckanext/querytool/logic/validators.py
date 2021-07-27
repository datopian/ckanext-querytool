import logging
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