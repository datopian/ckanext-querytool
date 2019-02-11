import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
from ckan.lib.plugins import DefaultTranslation

import ckanext.querytool.helpers as h
from ckanext.querytool.model import setup as model_setup
import ckanext.querytool.helpers as helpers
from ckanext.querytool import actions


class QuerytoolPlugin(plugins.SingletonPlugin, DefaultTranslation):
    plugins.implements(plugins.ITranslation)
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IRoutes)
    plugins.implements(plugins.IActions)
    plugins.implements(plugins.IConfigurable)
    plugins.implements(plugins.ITemplateHelpers)
    plugins.implements(plugins.IAuthFunctions)

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

        map.redirect('/querytool/public', '/querytool/public/groups',
                     _redirect_code='301 Moved Permanently')

        map.connect('querytool_groups', '/querytool/groups',
                    controller=querytool_controller, action='groups')

        map.connect('querytool_list_other', '/querytool/group/other',
                    controller=querytool_controller, action='list_other')

        map.connect('querytool_list_by_group', '/querytool/group/{group}',
                    controller=querytool_controller, action='list_by_group')

        map.connect('querytool_edit', '/querytool/edit{querytool:/.*|}',
                    controller=querytool_controller, action='querytool_edit')

        map.connect('querytool_delete', '/querytool/delete{querytool:/.*|}',
                    controller=querytool_controller, action='delete')

        map.connect('querytool_edit_visualizations',
                    '/querytool/edit_visualizations{querytool:/.*|}',
                    controller=querytool_controller,
                    action='edit_visualizations')

        map.connect('querytool_public', '/querytool/public/groups',
                    controller=querytool_controller, action='querytool_public')

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
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions
