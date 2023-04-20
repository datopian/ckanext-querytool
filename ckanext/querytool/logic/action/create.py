import logging as log
import six

import ckan
import ckan.logic as logic
import ckan.lib.navl.dictization_functions as df
import ckan.lib.uploader as uploader
from ckan.common import _
import ckan.plugins as plugins
import ckan.lib.dictization.model_save as model_save
import ckan.lib.plugins as lib_plugins

import ckanext.querytool.logic.action as querytool_action

_check_access = logic.check_access
_get_action = logic.get_action
ValidationError = logic.ValidationError
NotFound = logic.NotFound


log = log.getLogger(__name__)


def _group_or_org_create(context, data_dict, is_org=False):
    model = context['model']
    user = context['user']
    session = context['session']
    data_dict['is_organization'] = is_org

    upload = uploader.get_uploader('group')
    upload.update_data_dict(data_dict, 'image_url',
                            'image_upload', 'clear_upload')
    # get the schema
    group_type = data_dict.get('type')
    group_plugin = lib_plugins.lookup_group_plugin(group_type)
    try:
        schema = group_plugin.form_to_db_schema_options({
            'type': 'create', 'api': 'api_version' in context,
            'context': context})
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
        group_plugin, context, data_dict, schema,
        'organization_create' if is_org else 'group_create')
    log.debug('group_create validate_errs=%r user=%s group=%s data_dict=%r',
              errors, context.get('user'), data_dict.get('name'), data_dict)

    if errors:
        session.rollback()
        raise ValidationError(errors)

    rev = model.repo.new_revision()
    rev.author = user

    if 'message' in context:
        rev.message = context['message']
    else:
        rev.message = _(u'REST API: Create object %s') % data.get("name")

    group = model_save.group_dict_save(data, context)

    # Needed to let extensions know the group id
    session.flush()

    if is_org:
        plugin_type = plugins.IOrganizationController
    else:
        plugin_type = plugins.IGroupController

    for item in plugins.PluginImplementations(plugin_type):
        item.create(group)

    if is_org:
        activity_type = 'new organization'
    else:
        activity_type = 'new group'

    user_id = model.User.by_name(user.decode('utf8')).id

    activity_dict = {
        'user_id': user_id,
        'object_id': group.id,
        'activity_type': activity_type,
    }
    activity_dict['data'] = {
        'group': ckan.lib.dictization.table_dictize(group, context)
    }
    activity_create_context = {
        'model': model,
        'user': user,
        'defer_commit': True,
        'ignore_auth': True,
        'session': session
    }
    logic.get_action('activity_create')(activity_create_context, activity_dict)

    upload.upload(uploader.get_max_image_size())

    if not context.get('defer_commit'):
        model.repo.commit()
    context["group"] = group
    context["id"] = group.id

    # creator of group/org becomes an admin
    # this needs to be after the repo.commit or else revisions break
    member_dict = {
        'id': group.id,
        'object': user_id,
        'object_type': 'user',
        'capacity': 'admin',
    }
    member_create_context = {
        'model': model,
        'user': user,
        'ignore_auth': True,  # we are not a member of the group at this point
        'session': session
    }
    logic.get_action('member_create')(member_create_context, member_dict)

    log.debug('Created object %s' % group.name)

    return_id_only = context.get('return_id_only', False)
    action = 'organization_show' if is_org else 'group_show'

    output = context['id'] if return_id_only \
        else _get_action(action)(context, {'id': group.id})

    # Parent/Child groups

    group_parent = data_dict.get('parent')
    group_children = data_dict.get('children', '')
    group_children = group_children.split(',') \
        if group_children else []

    groups = _get_action('group_list')(context, {})

    if group_parent and group_parent not in groups:
        group_parent = ''

    group_children = [
        child for child in group_children
        if child in groups
    ]

    try:
        if group_parent:
            querytool_action.handle_group_parents(
                group, group_parent, is_extras=False
            )

        if group_children:
            querytool_action.handle_group_children(
                group, group_children, update_type='add'
            )
    except Exception as e:
        log.error('Error while creating group parent/child relationships: %s', e)

    # End Parent/Child groups

    return output


def group_create(context, data_dict):
    '''Create a new group.
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
    :param type: the type of the group (optional),
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
    return _group_or_org_create(context, data_dict)
