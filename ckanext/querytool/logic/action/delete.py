import logging

import ckan.logic as logic
from ckan.lib import navl
import ckan.plugins as plugins
from ckan.common import _

from ckanext.querytool.model import CkanextQueryTool
import ckanext.querytool.logic.action as querytool_action


log = logging.getLogger('ckan.logic')

validate = navl.dictization_functions.validate

# Define some shortcuts
# Ensure they are module-private so that they don't get loaded as available
# actions in the action API.
ValidationError = logic.ValidationError
NotFound = logic.NotFound
_check_access = logic.check_access
_get_or_bust = logic.get_or_bust
_get_action = logic.get_action


log = logging.getLogger(__name__)


def querytool_delete(context, data_dict):
    '''Delete querytool.
    :param name: the name of query
    :type name: string
    :rtype: dictionary
    '''
    _check_access('querytool_delete', context, data_dict)
    CkanextQueryTool.delete(id=data_dict['name'])


def _group_or_org_delete(context, data_dict, is_org=False):
    '''Delete a group.
    You must be authorized to delete the group.
    :param id: the name or id of the group
    :type id: string
    '''
    from sqlalchemy import or_

    model = context['model']
    user = context['user']
    id = _get_or_bust(data_dict, 'id')

    group = model.Group.get(id)
    context['group'] = group
    if group is None:
        raise NotFound('Group was not found.')

    revisioned_details = 'Group: %s' % group.name

    if is_org:
        _check_access('organization_delete', context, data_dict)
    else:
        _check_access('group_delete', context, data_dict)

    # organization delete will delete all datasets for that org
    # FIXME this gets all the packages the user can see which generally will
    # be all but this is only a fluke so we should fix this properly
    if is_org:
        for pkg in group.packages(with_private=True):
            _get_action('package_delete')(context, {'id': pkg.id})

    rev = model.repo.new_revision()
    rev.author = user
    rev.message = _(u'REST API: Delete %s') % revisioned_details

    # The group's Member objects are deleted
    # (including hierarchy connections to parent and children groups)
    for member in model.Session.query(model.Member).\
            filter(or_(model.Member.table_id == id,
                       model.Member.group_id == id)).\
            filter(model.Member.state == 'active').all():
        member.delete()

    group.delete()

    if is_org:
        plugin_type = plugins.IOrganizationController
    else:
        plugin_type = plugins.IGroupController

    for item in plugins.PluginImplementations(plugin_type):
        item.delete(group)

    # Parent/Child groups

    try:
        group_dict = _get_action('group_show')(context, {'id': group.id})
        group_parent = group_dict.get('parent')
        group_children = group_dict.get('children', '')
        group_children = group_children.split(',') \
            if group_children else []

        if group_parent:
            querytool_action.handle_group_parents(
                group, group_parent, is_extras=True
            )

        if group_children:
            querytool_action.handle_group_children(
                group, group_children, update_type='remove'
            )
    except Exception as e:
        log.error('Error while removing parent/child groups %s' % e)

    # End Parent/Child groups

    model.repo.commit()


def group_delete(context, data_dict):
    '''Delete a group.
    You must be authorized to delete the group.
    :param id: the name or id of the group
    :type id: string
    '''
    return _group_or_org_delete(context, data_dict)
