import logging as log
import six
from typing import Any, Union

import ckan
import ckan.logic as logic
import ckan.lib.navl.dictization_functions as df
import ckan.lib.uploader as uploader
from ckan.common import _
import ckan.plugins as plugins
import ckan.lib.dictization.model_save as model_save
import ckan.lib.plugins as lib_plugins

from ckan.types.logic import ActionResult
from ckan.types import Context, DataDict, Schema

import ckanext.querytool.logic.action as querytool_action

_check_access = logic.check_access
_get_action = logic.get_action
ValidationError = logic.ValidationError
NotFound = logic.NotFound
fresh_context = logic.fresh_context


log = log.getLogger(__name__)


def _querytool_group_or_org_create(
    context: Context, data_dict: DataDict, is_org: bool = False
) -> Union[str, dict[str, Any]]:
    model = context['model']
    user = context['user']
    session = context['session']
    data_dict['is_organization'] = is_org

    # Set default empty values for parent/child groups if none provided
    group_parent = data_dict.get("parent")
    group_children = data_dict.get("children", "")
    group_relationship_type = data_dict.get("group_relationship_type")

    data_dict["parent"] = group_parent
    data_dict["children"] = group_children
    data_dict["group_relationship_type"] = group_relationship_type

    upload = uploader.get_uploader('group')
    upload.update_data_dict(data_dict, 'image_url', 'image_upload', 'clear_upload')
    # get the schema
    group_type = data_dict.get('type', 'organization' if is_org else 'group')
    group_plugin = lib_plugins.lookup_group_plugin(group_type)
    try:
        schema: Schema = group_plugin.form_to_db_schema_options(
            {'type': 'create', 'api': 'api_version' in context, 'context': context}
        )
    except AttributeError:
        schema = group_plugin.form_to_db_schema()

    if 'api_version' not in context:
        # old plugins do not support passing the schema so we need
        # to ensure they still work
        try:
            group_plugin.check_data_dict(data_dict, schema)
        except TypeError:
            group_plugin.check_data_dict(data_dict)

    data, errors = lib_plugins.plugin_validate(
        group_plugin,
        context,
        data_dict,
        schema,
        'organization_create' if is_org else 'group_create',
    )
    log.debug(
        'group_create validate_errs=%r user=%s group=%s data_dict=%r',
        errors,
        context.get('user'),
        data_dict.get('name'),
        data_dict,
    )

    if errors:
        session.rollback()
        raise ValidationError(errors)

    group = model_save.group_dict_save(data, context)

    # Needed to let extensions know the group id
    session.flush()

    if is_org:
        plugin_type = plugins.IOrganizationController
    else:
        plugin_type = plugins.IGroupController

    for item in plugins.PluginImplementations(plugin_type):
        item.create(group)

    user_obj = model.User.by_name(six.ensure_text(user))
    assert user_obj

    upload.upload(uploader.get_max_image_size())

    if not context.get('defer_commit'):
        model.repo.commit()
    context["group"] = group
    context["id"] = group.id

    # creator of group/org becomes an admin
    # this needs to be after the repo.commit or else revisions break
    member_dict = {
        'id': group.id,
        'object': user_obj.id,
        'object_type': 'user',
        'capacity': 'admin',
    }
    member_create_context = fresh_context(context)
    # We are not a member of the group at this point
    member_create_context['ignore_auth'] = True

    logic.get_action('member_create')(member_create_context, member_dict)
    log.debug('Created object %s' % group.name)

    return_id_only = context.get('return_id_only', False)
    action = 'organization_show' if is_org else 'group_show'

    output = (
        context['id']
        if return_id_only
        else _get_action(action)(context, {'id': group.id})
    )

    # Parent/Child groups

    group_children = group_children.split(',') if group_children else []

    groups = _get_action('group_list')(context, {})

    if group_parent and group_parent not in groups:
        group_parent = ''

    group_children = [child for child in group_children if child in groups]

    try:
        if group_parent:
            querytool_action.handle_group_parents(group, group_parent, is_extras=False)

        if group_children:
            querytool_action.handle_group_children(
                group, group_children, update_type='add'
            )
    except Exception as e:
        log.error('Error while creating group parent/child relationships: %s', e)

    # End Parent/Child groups

    return output


def querytool_group_create(
    context: Context, data_dict: DataDict
) -> ActionResult.GroupCreate:
    '''Create a new querytool group.

    You must be authorized to create groups.

    Plugins may change the parameters of this function depending on the value
    of the ``type`` parameter, see the
    :py:class:`~ckan.plugins.interfaces.IGroupForm` plugin interface.

    :param name: the name of the group, a string between 2 and 100 characters
        long, containing only lowercase alphanumeric characters, ``-`` and
        ``_``
    :type name: string
    :param id: the id of the group (optional)
    :type id: string
    :param title: the title of the group (optional)
    :type title: string
    :param description: the description of the group (optional)
    :type description: string
    :param image_url: the URL to an image to be displayed on the group's page
        (optional)
    :type image_url: string
    :param type: the type of the group (optional, default: ``'group'``),
        :py:class:`~ckan.plugins.interfaces.IGroupForm` plugins
        associate themselves with different group types and provide custom
        group handling behaviour for these types
        Cannot be 'organization'
    :type type: string
    :param state: the current state of the group, e.g. ``'active'`` or
        ``'deleted'``, only active groups show up in search results and
        other lists of groups, this parameter will be ignored if you are not
        authorized to change the state of the group (optional, default:
        ``'active'``)
    :type state: string
    :param approval_status: (optional)
    :type approval_status: string
    :param extras: the group's extras (optional), extras are arbitrary
        (key: value) metadata items that can be added to groups, each extra
        dictionary should have keys ``'key'`` (a string), ``'value'`` (a
        string), and optionally ``'deleted'``
    :type extras: list of dataset extra dictionaries
    :param packages: the datasets (packages) that belong to the group, a list
        of dictionaries each with keys ``'name'`` (string, the id or name of
        the dataset) and optionally ``'title'`` (string, the title of the
        dataset)
    :type packages: list of dictionaries
    :param groups: the groups that belong to the group, a list of dictionaries
        each with key ``'name'`` (string, the id or name of the group) and
        optionally ``'capacity'`` (string, the capacity in which the group is
        a member of the group)
    :type groups: list of dictionaries
    :param users: the users that belong to the group, a list of dictionaries
        each with key ``'name'`` (string, the id or name of the user) and
        optionally ``'capacity'`` (string, the capacity in which the user is
        a member of the group)
    :type users: list of dictionaries

    :returns: the newly created group (unless 'return_id_only' is set to True
              in the context, in which case just the group id will
              be returned)
    :rtype: dictionary

    '''
    # wrapper for creating groups
    if data_dict.get('type') == 'organization':
        # FIXME better exception?
        raise Exception(_('Trying to create an organization as a group'))
    _check_access('group_create', context, data_dict)
    return _querytool_group_or_org_create(context, data_dict)
