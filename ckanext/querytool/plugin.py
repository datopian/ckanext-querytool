import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.logic.schema as ckan_schema

from ckan.lib.plugins import DefaultTranslation

import ckanext.querytool.helpers as h
import ckanext.querytool.helpers as helpers

from ckanext.querytool import actions
from ckanext.querytool.logic import validators
from ckanext.querytool.model import setup as model_setup


from ckan.lib.navl.validators import (ignore_missing,
                                      keep_extras,
                                      not_empty,
                                      empty,
                                      ignore,
                                      if_empty_same_as,
                                      not_missing,
                                      ignore_empty
                                      )


def group_form_schema():
    schema = ckan_schema.default_group_schema()

    schema['description'] = [ignore_missing, unicode, validators.description_length_validator]

    schema['packages'] = {
        "name": [not_empty, unicode],
        "title": [ignore_missing],
        "__extras": [ignore]
    }
    schema['users'] = {
        "name": [not_empty, unicode],
        "capacity": [ignore_missing],
        "__extras": [ignore]
    }
    schema['num_followers'] = []
    schema['package_count'] = [ignore_missing]

    return schema


class QuerytoolPlugin(plugins.SingletonPlugin, DefaultTranslation):
    plugins.implements(plugins.ITranslation)
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IRoutes)
    plugins.implements(plugins.IActions)
    plugins.implements(plugins.IConfigurable)
    plugins.implements(plugins.ITemplateHelpers)
    plugins.implements(plugins.IAuthFunctions)
    plugins.implements(plugins.IGroupForm, inherit=True)

    def group_types(self):
        return ('group', )

    def is_fallback(self):
        False

    def group_form(self):
        return 'group/snippets/group_form.html'

    def group_controller(self):
        return 'group'

    def form_to_db_schema(self):
        """
        Returns the schema for mapping group data from a form to a format
        suitable for the database.
        """
        schema = group_form_schema()
        schema.update({'additional_description' : [toolkit.get_converter('convert_to_extras'),
                            toolkit.get_validator('ignore_missing')]})
        return schema

    def db_to_form_schema(self):
        """
        Returns the schema for mapping group data from the database into a
        format suitable for the form (optional)
        """
        schema = group_form_schema()
        schema.update({'additional_description' : [toolkit.get_converter('convert_from_extras'),
                            toolkit.get_validator('ignore_missing')]})
        return schema


    def group_form(group_type='group'):
        return 'group/snippets/group_form.html'

    def index_template(self):
        return 'group/index.html'

    def read_template(self):
        return 'group/read.html'

    def new_template(self):
        return 'group/new.html'

    def edit_template(self):
        return 'group/edit.html'

    def about_template(self):
        return 'group/about.html'

    def history_template(self):
        return 'group/history.html'

    def activity_template(self):
        return 'group/activity_stream.html'

    def admins_template(self):
        return 'group/admins.html'


    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('fanstatic', 'querytool')

    # IRoutes

    def before_map(self, map):
        querytool_controller\
            = 'ckanext.querytool.controllers.querytool:QueryToolController'

        # Query tool routes
        map.redirect('/querytool', '/querytool/groups',
                     _redirect_code='301 Moved Permanently')

        map.connect('querytool_groups', '/querytool/groups',
                    controller=querytool_controller, action='groups')

        map.connect('querytool_list_by_group', '/querytool/group/{group}',
                    controller=querytool_controller, action='list_by_group')

        map.redirect('/querytool/public', '/querytool/public/groups',
                     _redirect_code='301 Moved Permanently')

        map.connect('querytool_list_other', '/querytool/group/other',
                    controller=querytool_controller, action='list_other')

        map.connect('querytool_edit', '/report/edit{querytool:/.*|}',
                    controller=querytool_controller, action='querytool_edit')

        map.connect('querytool_delete', '/report/delete{querytool:/.*|}',
                    controller=querytool_controller, action='delete')

        map.connect('querytool_edit_visualizations',
                    '/report/edit_visualizations{querytool:/.*|}',
                    controller=querytool_controller,
                    action='edit_visualizations')

        map.connect('querytool_public', '/',
                    controller=querytool_controller, action='querytool_public')

        map.connect('querytool_public_reports', '/querytool/public/reports',
                    controller=querytool_controller, action='querytool_public_reports')

        map.connect('querytool_public_list_by_group',
                    '/querytool/public/group/{group}',
                    controller=querytool_controller,
                    action='querytool_public_list')

        map.connect('querytool_public_read',
                    '/querytool/public/{name}',
                    controller=querytool_controller,
                    action='querytool_public_read')

        map.connect('querytool_download_data',
                    '/querytool/download/{name}',
                    controller=querytool_controller,
                    action='querytool_download_data')

        group_controller = 'ckanext.querytool.controllers.group:QuerytoolGroupController'


        map.connect('group_read_all_reports',
                    '/report',
                    controller=group_controller,
                    action='read_all_reports')
        map.connect('group_read_report',
                    '/group/{id}/reports',
                    controller=group_controller,
                    action='read_report')

        home_controller = 'ckanext.querytool.controllers.home:QuerytoolHomeController'
        map.connect('index',
                    '/',
                    controller=home_controller,
                    action='index')

        return map

    def after_map(self, map):
        return map

    # IActions

    def get_actions(self):
        module_root = 'ckanext.querytool.logic.action'
        action_functions = h._get_functions(module_root)
        action_functions['resource_delete'] = actions.resource_delete
        action_functions['resource_patch'] = actions.resource_patch
        action_functions['resource_update'] = actions.resource_update
        return action_functions

    # IConfigurable

    def configure(self, config):
        # Setup querytool model
        model_setup()

    # ITemplateHelpers

    def get_helpers(self):
        return {
            'querytool_get_datasets':
                helpers.get_all_datasets,
            'querytool_get_filter_values':
                helpers.get_filter_values,
            'querytool_get_chart_types':
                helpers.get_chart_types,
            'querytool_get_color_scheme':
                helpers.get_color_scheme,
            'querytool_get_dataset_resources':
                helpers.get_dataset_resources,
            'querytool_get_resource_columns':
                helpers.get_resource_columns,
            'querytool_get_numeric_resource_columns':
                helpers.get_numeric_resource_columns,
            'querytool_get_tick_text_rotation':
                helpers.get_tick_text_rotation,
            'queytool_get_charts_data_formats':
                helpers.get_charts_data_formats,
            'querytool_get_visualization_size':
                helpers.get_visualization_size,
            'querytool_get_uuid': helpers.get_uuid,
            'querytool_get_geojson_resources':
                helpers.get_geojson_resources,
            'querytool_get_geojson_properties':
                helpers.get_geojson_properties,
            'querytool_get_map_color_scheme':
                helpers.get_map_color_scheme,
            'querytool_get_chart_sort':
                helpers.get_chart_sort,
            'querytool_get_groups':
                helpers.get_groups,
            'querytool_get_map_config':
                helpers.get_map_config,
            'querytool_hex_to_rgba':
                helpers.hex_to_rgba,
            'querytool_get_public_breadcrumb_name':
                helpers.get_public_breadcrumb_name,
            'querytool_allow_nav_bar':
                helpers.allow_nav_bar,
            'querytool_parse_y_axis_columns':
                helpers.parse_y_axis_columns,
            'querytool_pick_first_by_attr_value':
                helpers.pick_first_by_attr_value,
            'querytool_parse_json':
                helpers.parse_json,
            'querytool_dump_json':
                helpers.dump_json,
            'querytool_get_dataset_url_path':
                helpers.get_dataset_url_path,
            'querytool_get_all_reports':
                helpers.get_all_reports,
            'get_user_permission':
                helpers.get_user_permission,
            'get_groups_for_user':
                helpers.get_groups_for_user,
            'querytool_get_chart_colors':
                helpers.get_querytool_get_chart_colors,
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions


    # IConfigurer

    def update_config_schema(self, schema):
        schema.update({
            'ckan.welcome_page_title': [ignore_missing, unicode],
            'ckan.welcome_page_description': [ignore_missing, unicode],
        })

        return schema