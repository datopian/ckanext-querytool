import logging
import sqlalchemy as sqla

import ckan.logic as logic
from ckan.lib import navl
import ckan.plugins as plugins
from ckan.common import _
from ckan import authz

from ckan.types.logic import ActionResult
from ckan.types import Context, DataDict

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


def _querytool_group_or_org_delete(
    context: Context, data_dict: DataDict, is_org: bool = False
):
    '''Delete a querytool group.

    You must be authorized to delete the group.

    :param id: the name or id of the group
    :type id: string

    '''
    from sqlalchemy import or_

    model = context['model']
    id = _get_or_bust(data_dict, 'id')

    group = model.Group.get(id)
    if group is None:
        raise NotFound('Group was not found.')
    context['group'] = group

    if is_org:
        _check_access('organization_delete', context, data_dict)
    else:
        _check_access('group_delete', context, data_dict)

    # organization delete will not occur while all datasets for that org are
    # not deleted
    if is_org:
        datasets = (
            model.Session.query(model.Package)
            .filter_by(owner_org=group.id)
            .filter(model.Package.state != 'deleted')
            .count()
        )
        if datasets:
            if not authz.check_config_permission('ckan.auth.create_unowned_dataset'):
                raise ValidationError(
                    {
                        'message': _(
                            'Organization cannot be deleted while it '
                            'still has datasets'
                        )
                    }
                )

            pkg_table = model.package_table
            # using Core SQLA instead of the ORM should be faster
            model.Session.execute(
                pkg_table.update()
                .where(
                    sqla.and_(
                        pkg_table.c["owner_org"] == group.id,
                        pkg_table.c["state"] != 'deleted',
                    )
                )
                .values(owner_org=None)
            )

    # The group's Member objects are deleted
    # (including hierarchy connections to parent and children groups)
    for member in (
        model.Session.query(model.Member)
        .filter(or_(model.Member.table_id == id, model.Member.group_id == id))
        .filter(model.Member.state == 'active')
        .all()
    ):
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
        group_children = group_children.split(',') if group_children else []

        if group_parent:
            querytool_action.handle_group_parents(group, group_parent, is_extras=True)

        if group_children:
            querytool_action.handle_group_children(
                group, group_children, update_type='remove'
            )
    except Exception as e:
        log.error('Error while removing parent/child groups %s' % e)

    # End Parent/Child groups

    model.repo.commit()


def querytool_group_delete(
    context: Context, data_dict: DataDict
) -> ActionResult.GroupDelete:
    '''Delete a querytool group.

    You must be authorized to delete the group.

    :param id: the name or id of the group
    :type id: string

    '''
    return _querytool_group_or_org_delete(context, data_dict)


def _querytool_group_or_org_purge(context: Context, data_dict: DataDict, is_org: bool = False):
    '''Purge a querytool group or organization.

    The group or organization will be completely removed from the database.
    This cannot be undone!

    Only sysadmins can purge groups or organizations.

    :param id: the name or id of the group or organization to be purged
    :type id: string

    :param is_org: you should pass is_org=True if purging an organization,
        otherwise False (optional, default: False)
    :type is_org: bool

    '''
    model = context['model']
    id = _get_or_bust(data_dict, 'id')

    group = model.Group.get(id)
    if group is None:
        if is_org:
            raise NotFound('Organization was not found')
        else:
            raise NotFound('Group was not found')
    context['group'] = group

    if is_org:
        _check_access('organization_purge', context, data_dict)
    else:
        _check_access('group_purge', context, data_dict)

    if is_org:
        # Clear the owner_org field
        datasets = (
            model.Session.query(model.Package)
            .filter_by(owner_org=group.id)
            .filter(model.Package.state != 'deleted')
            .count()
        )
        if datasets:
            if not authz.check_config_permission('ckan.auth.create_unowned_dataset'):
                raise ValidationError(
                    {
                        'message': 'Organization cannot be purged while it '
                        'still has datasets'
                    }
                )
            pkg_table = model.package_table
            # using Core SQLA instead of the ORM should be faster
            model.Session.execute(
                pkg_table.update()
                .where(
                    sqla.and_(
                        pkg_table.c["owner_org"] == group.id,
                        pkg_table.c["state"] != 'deleted',
                    )
                )
                .values(owner_org=None)
            )

    # Delete related Memberships
    members = model.Session.query(model.Member).filter(
        sqla.or_(model.Member.group_id == group.id, model.Member.table_id == group.id)
    )
    if members.count() > 0:
        for m in members.all():
            m.purge()
        model.repo.commit_and_remove()

    group = model.Group.get(id)
    assert group
    group.purge()

    # Parent/Child groups

    try:
        group_dict = _get_action('group_show')(context, {'id': group.id})
        group_parent = group_dict.get('parent')
        group_children = group_dict.get('children', '')
        group_children = group_children.split(',') if group_children else []

        if group_parent:
            querytool_action.handle_group_parents(group, group_parent, is_extras=True)

        if group_children:
            querytool_action.handle_group_children(
                group, group_children, update_type='remove'
            )
    except Exception as e:
        log.error('Error while removing parent/child groups %s' % e)

    # End Parent/Child groups

    model.repo.commit_and_remove()


def querytool_group_purge(context: Context, data_dict: DataDict) -> None:
    '''Purge a querytool group.

    .. warning:: Purging a group cannot be undone!

    Purging a group completely removes the group from the CKAN database,
    whereas deleting a group simply marks the group as deleted (it will no
    longer show up in the frontend, but is still in the db).

    Datasets in the organization will remain, just not in the purged group.

    You must be authorized to purge the group.

    :param id: the name or id of the group to be purged
    :type id: string

    '''
    return _querytool_group_or_org_purge(context, data_dict, is_org=False)
