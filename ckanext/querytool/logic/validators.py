import logging
import ckan.plugins as p
import ckan.lib.navl.dictization_functions as df

from ckanext.querytool.model import CkanextQueryTool
from ckan.common import _
import ckan.logic as logic
import ckan.authz as authz

log = logging.getLogger(__name__)

Invalid = df.Invalid
StopOnError = df.StopOnError
Missing = df.Missing
missing = df.missing

DESCRIPTION_MAX_LENGTH = 300


def owner_org_validator(key, data, errors, context):

    value = data.get(key)

    if value is missing or value is None:
        if not authz.check_config_permission('create_unowned_dataset'):
            raise Invalid(_('An organization must be provided'))
        data.pop(key, None)
        raise df.StopOnError

    model = context['model']
    user = context['user']
    user = model.User.get(user)
    package = context.get('package')

    if value == '':
        if not authz.check_config_permission('create_unowned_dataset'):
            raise Invalid(_('An organization must be provided'))
        return

    if (authz.check_config_permission('allow_dataset_collaborators')
            and not authz.check_config_permission('allow_collaborators_to_change_owner_org')):

        if package and user and not user.sysadmin:
            is_collaborator = authz.user_is_collaborator_on_dataset(
                user.id, package.id, ['admin', 'editor'])
            if is_collaborator:
                # User is a collaborator, check if it's also a member with
                # edit rights of the current organization (redundant, but possible)
                user_orgs = logic.get_action(
                    'organization_list_for_user')(
                        {'ignore_auth': True}, {'id': user.id, 'permission': 'update_dataset'})
                user_is_org_member = package.owner_org in [org['id'] for org in user_orgs]
                if data.get(key) != package.owner_org and not user_is_org_member:
                    raise Invalid(_('You cannot move this dataset to another organization'))

    group = model.Group.get(value)
    if not group:
        raise Invalid(_('Organization does not exist'))
    group_id = group.id

    if not package:
        #or (package and package.owner_org != group_id):
        ## This is a new dataset or we are changing the organization
        #if not context.get(u'ignore_auth', False) and not(user.sysadmin or
        #       authz.has_user_permission_for_group_or_org(
        #           group_id, user.name, 'create_dataset')):
        raise Invalid(_('You cannot add a dataset to this organization'))

    data[key] = group_id


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