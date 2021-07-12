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
