import datetime
import json
import cgi
import time
import logging as log

from ckan.common import config
import ckan.logic as logic
import ckan.logic.schema as schema_
import ckan.lib.navl.dictization_functions as df
from ckan.plugins import toolkit
import ckan.lib.helpers as h
import ckan.lib.uploader as uploader
import ckan.lib.app_globals as app_globals
from ckan.common import _
import ckan.plugins as plugins
import ckan.lib.dictization as dictization
import ckan.lib.dictization.model_dictize as model_dictize
import ckan.lib.dictization.model_save as model_save
import ckan.lib.plugins as lib_plugins
import ckan.lib.datapreview

from ckan.types.logic import ActionResult
from ckan.types import Context, DataDict


from ckanext.querytool.logic import schema
import ckanext.querytool.logic.action as querytool_action
from ckanext.querytool.model import (
    CkanextQueryTool,
    table_dictize,
    CkanextQueryToolVisualizations,
)

check_access = logic.check_access
_get_action = logic.get_action
ValidationError = logic.ValidationError
_validate = df.validate
NotFound = logic.NotFound
_get_or_bust = logic.get_or_bust


log = log.getLogger(__name__)


def querytool_update(context, data_dict):
    '''
        Create new query tool
    :param title
    :param description
    :param dataset
    :param filters
    :param created
    :param map_resource
    :param chart_resource
    :param y_axis_columns
    :param selection_label
    :param report_caption
    :param download_options
    '''

    # we need the querytool name in the context for name validation
    context['querytool'] = data_dict['querytool']
    session = context['session']
    data, errors = df.validate(data_dict, schema.querytool_schema(), context)

    if errors:
        raise toolkit.ValidationError(errors)

    querytool = CkanextQueryTool.get(name=data_dict['querytool'])
    visualizations = CkanextQueryToolVisualizations.get(name=data_dict['querytool'])

    # if name is not changed don't insert in visualizations table
    is_changed = False
    if visualizations:
        is_changed = querytool.name == visualizations.name

    if visualizations and is_changed:
        visualizations.name = data.get('name')
        visualizations.save()
        session.add(querytool)
        session.commit()

    if not querytool:
        querytool = CkanextQueryTool()

    items = [
        'title',
        'description',
        'name',
        'private',
        'type',
        'group',
        'dataset_name',
        'owner_org',
        'icon',
        'image_url',
        'image_display_url',
        'filters',
        'sql_string',
        'related_querytools',
        'chart_resource',
        'y_axis_columns',
        'additional_description',
        'selection_label',
        'report_caption',
        'download_options',
    ]

    dataset_name = data.get('dataset_name')
    dataset = _get_action('package_show')(context, {'id': dataset_name})
    dataset['groups'] = [{'name': str(data.get('group'))}]
    context['ignore_auth'] = True
    _get_action('package_patch')(context, dataset)

    image_url = data_dict['image_url']

    if h.uploads_enabled():
        image_upload = data_dict['image_upload']
        if isinstance(image_upload, cgi.FieldStorage):
            upload = uploader.get_uploader('querytool', image_url)
            upload.update_data_dict(
                data_dict, 'image_url', 'image_upload', 'clear_upload'
            )
            upload.upload(uploader)
            data_dict['image_display_url'] = upload.filename
            data['image_display_url'] = upload.filename
        else:
            data['image_display_url'] = querytool.image_display_url

    for item in items:
        setattr(querytool, item, data.get(item))

    querytool.modified = datetime.datetime.utcnow()
    querytool.save()

    session.add(querytool)
    session.commit()


def querytool_visualizations_update(context, data_dict):
    '''
        Create new query tool visualizations
    :param name
    :param visualizations
    :param
    '''

    session = context['session']
    # data, errors = df.validate(data_dict, schema.querytool_schema(),
    #                          context)

    # if errors:
    #    raise toolkit.ValidationError(errors)
    querytool = CkanextQueryTool.get(name=data_dict['name'])
    visualizations = CkanextQueryToolVisualizations.get(name=data_dict['name'])

    images = []
    if visualizations:
        items = json.loads(visualizations.visualizations)
        for image in items:
            if image['type'] == 'image':
                images.append(image)

    new_items = json.loads(data_dict['visualizations'])
    new_images = []

    if new_items:
        for new in new_items:
            if new['type'] == 'image':
                new_images.append(new['url'])

    if new_images or images:
        for old in images:
            old_img_url = old['url']
            if old_img_url not in new_images:
                upload = uploader.get_uploader('vs', old_img_url)
                new_data = {
                    'image_url': old_img_url,
                    'image_upload': 'true',
                    'clear_upload': 'true',
                }
                upload.update_data_dict(
                    new_data, 'image_url', 'image_upload', 'clear_upload'
                )
                upload.upload(uploader)

    if not visualizations:
        visualizations = CkanextQueryToolVisualizations()

    visualizations.name = data_dict['name']
    visualizations.visualizations = data_dict['visualizations']
    visualizations.y_axis_column = data_dict['y_axis_column']
    visualizations.ckanext_querytool_id = querytool.id
    visualizations.save()
    session.add(visualizations)
    session.commit()


def config_option_update(context, data_dict):
    '''

    .. versionadded:: 2.4

    Allows to modify some CKAN runtime-editable config options

    It takes arbitrary key, value pairs and checks the keys against the
    config options update schema. If some of the provided keys are not present
    in the schema a :py:class:`~ckan.plugins.logic.ValidationError` is raised.
    The values are then validated against the schema, and if validation is
    passed, for each key, value config option:

    * It is stored on the ``system_info`` database table
    * The Pylons ``config`` object is updated.
    * The ``app_globals`` (``g``) object is updated (this only happens for
      options explicitly defined in the ``app_globals`` module.

    The following lists a ``key`` parameter, but this should be replaced by
    whichever config options want to be updated, eg::

        get_action('config_option_update)({}, {
            'ckan.site_title': 'My Open Data site',
            'ckan.homepage_layout': 2,
        })

    :param key: a configuration option key (eg ``ckan.site_title``). It must
        be present on the ``update_configuration_schema``
    :type key: string

    :returns: a dictionary with the options set
    :rtype: dictionary

    .. note:: You can see all available runtime-editable configuration options
        calling
        the :py:func:`~ckan.logic.action.get.config_option_list` action

    .. note:: Extensions can modify which configuration options are
        runtime-editable.
        For details, check :doc:`/extensions/remote-config-update`.

    .. warning:: You should only add config options that you are comfortable
        they can be edited during runtime, such as ones you've added in your
        own extension, or have reviewed the use of in core CKAN.

    '''
    model = context['model']

    check_access('config_option_update', context, data_dict)

    schema = schema_.update_configuration_schema()

    available_options = schema.keys()

    provided_options = data_dict.keys()

    unsupported_options = set(provided_options) - set(available_options)

    if unsupported_options:
        msg = 'Configuration option(s) \'{0}\' can not be updated'.format(
            ' '.join(list(unsupported_options))
        )

        raise ValidationError({'message': msg})

    upload = uploader.get_uploader('admin')
    upload.update_data_dict(
        data_dict, 'ckan.site_logo', 'logo_upload', 'clear_logo_upload'
    )
    upload.upload(uploader.get_max_image_size())

    # Upload header image for custom theme
    upload.update_data_dict(
        data_dict, 'header_image_url', 'header_image_upload', 'header_clear_upload'
    )
    upload.upload(uploader.get_max_image_size())

    # Upload footer logo 1 for custom theme
    upload.update_data_dict(
        data_dict,
        'footer_logo_image_url',
        'footer_logo_image_upload',
        'footer_logo_clear_upload',
    )
    upload.upload(uploader.get_max_image_size())

    # Upload footer logo 2 for custom theme
    upload.update_data_dict(
        data_dict,
        'footer_logo2_image_url',
        'footer_logo2_image_upload',
        'footer_logo2_clear_upload',
    )
    upload.upload(uploader.get_max_image_size())

    # Remove leftover header_image_upload
    if data_dict.get('header_image_upload'):
        data_dict['header_image_upload'] = ''

    # Remove leftover footer_logo_image_upload
    if data_dict.get('footer_logo_image_upload'):
        data_dict['footer_logo_image_upload'] = ''

    # Remove leftover footer_logo2_image_upload
    if data_dict.get('footer_logo2_image_upload'):
        data_dict['footer_logo2_image_upload'] = ''

    data, errors = _validate(data_dict, schema, context)

    if errors:
        model.Session.rollback()
        raise ValidationError(errors)

    for key, value in data.items():

        # Set full Logo url
        if key == 'ckan.site_logo' and value and not value.startswith('http'):
            value = h.url_for_static('uploads/admin/{0}'.format(value))

        # Set full Header image url
        if key == 'header_image_url' and value and not value.startswith('http'):
            value = h.url_for_static('uploads/admin/{0}'.format(value))

        # Set full Footer logo 1 image url
        if key == 'footer_logo_image_url' and value and not value.startswith('http'):
            value = h.url_for_static('uploads/admin/{0}'.format(value))

        # Set full Footer logo 2 image url
        if key == 'footer_logo2_image_url' and value and not value.startswith('http'):
            value = h.url_for_static('uploads/admin/{0}'.format(value))

        # Save value in database
        model.set_system_info(key, value)

        # Update CKAN's `config` object
        config[key] = value

        # Only add it to the app_globals (`g`) object if explicitly defined
        # there
        globals_keys = list(app_globals.app_globals_from_config_details.keys())
        if key in globals_keys:
            app_globals.set_app_global(key, value)

    # Update the config update timestamp
    model.set_system_info('ckan.config_update', str(time.time()))

    log.info('Updated config options: {0}'.format(data))

    return data


def _querytool_group_or_org_update(
    context: Context, data_dict: DataDict, is_org: bool = False
):
    model = context['model']
    session = context['session']
    id = _get_or_bust(data_dict, 'id')

    is_relationship = context.get('is_relationship', False)

    group = model.Group.get(id)
    if group is None:
        raise NotFound('Group was not found.')

    group_extras = (
        model.Session.query(model.GroupExtra)
        .filter(model.GroupExtra.group_id == group.id)
        .all()
    )

    group_extras = {
        group_extra.key: group_extra.value
        for group_extra in group_extras
        if group_extra.key in ["parent", "children"]
    }

    if data_dict.get('group_relationship_type') == 'parent':
        data_dict['parent'] = ''
    elif data_dict.get('group_relationship_type') == 'child':
        data_dict['children'] = ''

    context["group"] = group

    data_dict_type = data_dict.get('type')
    if data_dict_type is None:
        data_dict['type'] = group.type
    else:
        if data_dict_type != group.type:
            raise ValidationError({"message": "Type cannot be updated"})

    # get the schema
    group_plugin = lib_plugins.lookup_group_plugin(group.type)
    try:
        schema = group_plugin.form_to_db_schema_options(
            {'type': 'update', 'api': 'api_version' in context, 'context': context}
        )
    except AttributeError:
        schema = group_plugin.form_to_db_schema()

    upload = uploader.get_uploader('group')
    upload.update_data_dict(data_dict, 'image_url', 'image_upload', 'clear_upload')

    if is_org:
        check_access('organization_update', context, data_dict)
    else:
        check_access('group_update', context, data_dict)

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
        'organization_update' if is_org else 'group_update',
    )

    group = context.get('group')
    log.debug(
        'group_update validate_errs=%r user=%s group=%s data_dict=%r',
        errors,
        context.get('user'),
        group.name if group else '',
        data_dict,
    )

    if errors:
        session.rollback()
        raise ValidationError(errors)

    contains_packages = 'packages' in data_dict

    group = model_save.group_dict_save(
        data, context, prevent_packages_update=is_org or not contains_packages
    )

    if is_org:
        plugin_type = plugins.IOrganizationController
    else:
        plugin_type = plugins.IGroupController

    for item in plugins.PluginImplementations(plugin_type):
        item.edit(group)

    upload.upload(uploader.get_max_image_size())

    if not context.get('defer_commit'):
        model.repo.commit()

    # Parent/Child groups

    group_parent = data_dict.get('parent')
    group_extras_parent = group_extras.get('parent')

    group_children = data_dict.get('children', '')
    group_children = group_children.split(',') if group_children else []

    groups = _get_action('group_list')(context, {})

    if group_parent not in groups:
        group_parent = ''

    group_children = [child for child in group_children if child in groups]

    group_extras_children = group_extras.get('children', '')
    group_extras_children = (
        group_extras_children.split(',') if group_extras_children else []
    )

    children_to_remove = [
        child for child in group_extras_children if child not in group_children
    ]
    children_to_add = [
        child for child in group_children if child not in group_extras_children
    ]

    if is_relationship is False:
        try:
            if group_parent:
                querytool_action.handle_group_parents(
                    group, group_parent, is_extras=False
                )

            elif group_extras_parent:
                querytool_action.handle_group_parents(
                    group, group_extras_parent, is_extras=True
                )

            if children_to_remove:
                querytool_action.handle_group_children(
                    group, children_to_remove, update_type='remove'
                )

            if children_to_add:
                querytool_action.handle_group_children(
                    group, children_to_add, update_type='add'
                )
        except Exception as e:
            log.error('Error while updating parent/child groups: %s', e)

    # End Parent/Child groups

    return model_dictize.group_dictize(group, context)


def querytool_group_update(
    context: Context, data_dict: DataDict
) -> ActionResult.GroupUpdate:
    '''Update a querytool group.

    You must be authorized to edit the group.

    .. note:: Update methods may delete parameters not explicitly provided in the
        data_dict. If you want to edit only a specific attribute use `group_patch`
        instead.

    Plugins may change the parameters of this function depending on the value
    of the group's ``type`` attribute, see the
    :py:class:`~ckan.plugins.interfaces.IGroupForm` plugin interface.

    For further parameters see
    :py:func:`~ckan.logic.action.create.group_create`.

    :param id: the name or id of the group to update
    :type id: string

    :returns: the updated group
    :rtype: dictionary

    '''
    # Callers that set context['allow_partial_update'] = True can choose to not
    # specify particular keys and they will be left at their existing
    # values. This includes: packages, users, groups, tags, extras
    return _querytool_group_or_org_update(context, data_dict)
