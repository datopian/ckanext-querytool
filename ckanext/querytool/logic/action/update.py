import datetime
import json
import cgi
import ckan.logic as logic
import ckan.lib.navl.dictization_functions as df
from ckan.plugins import toolkit
import ckan.lib.helpers as h
import ckan.lib.uploader as uploader
from ckanext.querytool.logic import schema
from ckanext.querytool.model import CkanextQueryTool, table_dictize,\
                                    CkanextQueryToolVisualizations

import logging
import ckan.plugins as plugins
import ckan.lib.dictization.model_save as model_save
import ckan.lib.navl.dictization_functions
import ckan.lib.plugins as lib_plugins
import ckan.lib.datapreview
from ckan.common import _, c
from ckanext.querytool import logic as l
from ckanext.querytool import helpers as helpers

log = logging.getLogger(__name__)

# Define some shortcuts
# Ensure they are module-private so that they don't get loaded as available
# actions in the action API.
_validate = ckan.lib.navl.dictization_functions.validate
NotFound = logic.NotFound
_check_access = l.check_access
ValidationError = logic.ValidationError
_get_or_bust = logic.get_or_bust

check_access = logic.check_access
_get_action = logic.get_action


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
    '''

    # we need the querytool name in the context for name validation
    context['querytool'] = data_dict['querytool']
    session = context['session']
    data, errors = df.validate(data_dict, schema.querytool_schema(),
                               context)

    if errors:
        raise toolkit.ValidationError(errors)

    querytool = CkanextQueryTool.get(name=data_dict['querytool'])
    visualizations = \
        CkanextQueryToolVisualizations.get(name=data_dict['querytool'])

    # if name is not changed don't insert in visualizations table
    is_changed = False
    if visualizations:
        is_changed = (querytool.name == visualizations.name)

    if visualizations and is_changed:
        visualizations.name = data.get('name')
        visualizations.save()
        session.add(querytool)
        session.commit()

    if not querytool:
        querytool = CkanextQueryTool()

    items = ['title', 'description', 'name', 'private', 'type', 'group',
             'dataset_name', 'owner_org', 'icon', 'image_url', 'image_display_url',
             'filters', 'sql_string', 'related_querytools',
             'chart_resource', 'y_axis_columns', 'additional_description', 'selection_label',
             'report_caption']

    dataset_name = data.get('dataset_name')
    dataset = _get_action('package_show')(context, {'id': dataset_name})
    dataset['groups'] = [{'name': str(data.get('group'))}]
    _get_action('package_patch')(context, dataset)

    image_url = data_dict['image_url']

    if h.uploads_enabled():
        image_upload = data_dict['image_upload']
        if isinstance(image_upload, cgi.FieldStorage):
            upload = uploader.get_uploader('querytool', image_url)
            upload.update_data_dict(data_dict,
                                    'image_url',
                                    'image_upload',
                                    'clear_upload')
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
    if new_items:
        new_images = []
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
                    'clear_upload': 'true'
                }
                upload.update_data_dict(new_data, 'image_url', 'image_upload',
                                        'clear_upload')
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


def package_update(context, data_dict):
    '''Update a dataset (package).
    You must be authorized to edit the dataset and the groups that it belongs
    to.
    It is recommended to call
    :py:func:`ckan.logic.action.get.package_show`, make the desired changes to
    the result, and then call ``package_update()`` with it.
    Plugins may change the parameters of this function depending on the value
    of the dataset's ``type`` attribute, see the
    :py:class:`~ckan.plugins.interfaces.IDatasetForm` plugin interface.
    For further parameters see
    :py:func:`~ckan.logic.action.create.package_create`.
    :param id: the name or id of the dataset to update
    :type id: string
    :returns: the updated dataset (if ``'return_package_dict'`` is ``True`` in
              the context, which is the default. Otherwise returns just the
              dataset id)
    :rtype: dictionary
    '''
    model = context['model']
    user = context['user']
    name_or_id = data_dict.get('id') or data_dict.get('name')
    if name_or_id is None:
        raise ValidationError({'id': _('Missing value')})

    pkg = model.Package.get(name_or_id)
    if pkg is None:
        raise NotFound(_('Package was not found.'))
    context["package"] = pkg
    data_dict["id"] = pkg.id
    data_dict['type'] = pkg.type

    #_check_access('package_update', context, data_dict)

    # get the schema
    package_plugin = lib_plugins.lookup_package_plugin(pkg.type)
    if 'schema' in context:
        schema = context['schema']
    else:
        schema = package_plugin.update_package_schema()

    if 'api_version' not in context:
        # check_data_dict() is deprecated. If the package_plugin has a
        # check_data_dict() we'll call it, if it doesn't have the method we'll
        # do nothing.
        check_data_dict = getattr(package_plugin, 'check_data_dict', None)
        if check_data_dict:
            try:
                package_plugin.check_data_dict(data_dict, schema)
            except TypeError:
                # Old plugins do not support passing the schema so we need
                # to ensure they still work.
                package_plugin.check_data_dict(data_dict)

    data, errors = lib_plugins.plugin_validate(
        package_plugin, context, data_dict, schema, 'package_update')
    log.debug('package_update validate_errs=%r user=%s package=%s data=%r',
              errors, context.get('user'),
              context.get('package').name if context.get('package') else '',
              data)

    if errors:
        if not helpers.get_is_admin_or_editor_of_any_group(c.userobj):
            log.error(errors)
            model.Session.rollback()
            raise ValidationError(errors)

    rev = model.repo.new_revision()
    rev.author = user
    if 'message' in context:
        rev.message = context['message']
    else:
        rev.message = _(u'REST API: Update object %s') % data.get("name")

    #avoid revisioning by updating directly
    model.Session.query(model.Package).filter_by(id=pkg.id).update(
        {"metadata_modified": datetime.datetime.utcnow()})
    model.Session.refresh(pkg)

    pkg = model_save.package_dict_save(data, context)

    context_org_update = context.copy()
    context_org_update['ignore_auth'] = True
    context_org_update['defer_commit'] = True
    context_org_update['add_revision'] = False
    _get_action('package_owner_org_update')(context_org_update,
                                            {'id': pkg.id,
                                             'organization_id': pkg.owner_org})

    # Needed to let extensions know the new resources ids
    model.Session.flush()
    if data.get('resources'):
        for index, resource in enumerate(data['resources']):
            resource['id'] = pkg.resources[index].id

    for item in plugins.PluginImplementations(plugins.IPackageController):
        item.edit(pkg)

        item.after_update(context, data)

    if not context.get('defer_commit'):
        model.repo.commit()

    log.debug('Updated object %s' % pkg.name)

    return_id_only = context.get('return_id_only', False)

    # Make sure that a user provided schema is not used on package_show
    context.pop('schema', None)

    # we could update the dataset so we should still be able to read it.
    context['ignore_auth'] = True
    output = data_dict['id'] if return_id_only \
            else _get_action('package_show')(context, {'id': data_dict['id']})

    return output
