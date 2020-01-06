import logging
import ckan.plugins as p
from ckanext.querytool.model import CkanextQueryTool

log = logging.getLogger(__name__)


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
