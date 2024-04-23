import logging

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckan.logic.schema as ckan_schema
import ckan.lib.helpers as ckan_helpers

from ckan.lib.plugins import DefaultTranslation
import ckan.logic as logic

import ckanext.querytool.helpers as h
import ckanext.querytool.helpers as helpers

from ckanext.querytool import actions
from ckanext.querytool.logic import validators
from ckanext.querytool.model import setup as model_setup
import ckanext.querytool.commands as vs_commands
import os
import sys


from ckan.lib.navl.validators import (ignore_missing,
                                      keep_extras,
                                      not_empty,
                                      empty,
                                      ignore,
                                      if_empty_same_as,
                                      not_missing,
                                      ignore_empty,
                                      unicode_safe,
                                      )

log = logging.getLogger(__name__)


def group_form_schema():
    schema = ckan_schema.default_group_schema()

    schema['description'] = [ignore_missing, unicode_safe, validators.description_length_validator]

    schema['packages'] = {
        "name": [not_empty, unicode_safe],
        "title": [ignore_missing],
        "__extras": [ignore]
    }
    schema['users'] = {
        "name": [not_empty, unicode_safe],
        "capacity": [ignore_missing],
        "__extras": [ignore]
    }
    schema['num_followers'] = []
    schema['package_count'] = [ignore_missing]

    return schema


class QuerytoolPlugin(plugins.SingletonPlugin):
    # plugins.implements(plugins.ITranslation, inherit=False)
    plugins.implements(plugins.IConfigurer)
    # plugins.implements(plugins.IRoutes)
    plugins.implements(plugins.IActions)
    plugins.implements(plugins.IConfigurable)
    plugins.implements(plugins.ITemplateHelpers)
    plugins.implements(plugins.IAuthFunctions)
    plugins.implements(plugins.IGroupForm, inherit=True)
    plugins.implements(plugins.IClick)

    # ITranslation
    def i18n_directory(self):
        '''Change the directory of the *.mo translation files
        The default implementation assumes the plugin is
        ckanext/myplugin/plugin.py and the translations are stored in
        i18n/
        '''
        # assume plugin is called ckanext.<myplugin>.<...>.PluginClass
        extension_module_name = '.'.join(self.__module__.split('.')[:3])
        module = sys.modules[extension_module_name]
        return os.path.join(os.path.dirname(module.__file__), 'i18n')

    def i18n_locales(self):
        '''Change the list of locales that this plugin handles
        By default the will assume any directory in subdirectory in the
        directory defined by self.directory() is a locale handled by this
        plugin
        '''
        directory = self.i18n_directory()
        return [
            d for
            d in os.listdir(directory)
            if os.path.isdir(os.path.join(directory, d))
        ]

    def i18n_domain(self):
        '''Change the gettext domain handled by this plugin
        This implementation assumes the gettext domain is
        ckanext-{extension name}, hence your pot, po and mo files should be
        named ckanext-{extension name}.mo'''
        return 'ckanext-{name}'.format(name=self.name)

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
        schema.update(
            {
                'additional_description': [
                    toolkit.get_converter('convert_to_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'group_relationship_type': [
                    toolkit.get_converter('convert_to_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'parent': [
                    toolkit.get_converter('convert_to_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'children': [
                    toolkit.get_converter('convert_to_extras'),
                    toolkit.get_validator('ignore_missing')
                ]
            }
        )
        return schema

    def db_to_form_schema(self):
        """
        Returns the schema for mapping group data from the database into a
        format suitable for the form (optional)
        """
        schema = group_form_schema()
        schema.update(
            {
                'additional_description': [
                    toolkit.get_converter('convert_from_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'group_relationship_type': [
                    toolkit.get_converter('convert_from_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'parent': [
                    toolkit.get_converter('convert_from_extras'),
                    toolkit.get_validator('ignore_missing')
                ],
                'children': [
                    toolkit.get_converter('convert_from_extras'),
                    toolkit.get_validator('ignore_missing')
                ]
            }
        )
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
        toolkit.add_resource('assets', 'querytool')

    # IRoutes

    def before_map(self, map):
        querytool_controller\
            = 'ckanext.querytool.controllers.querytool:QueryToolController'

        group_controller = 'ckanext.querytool.controllers.group:QuerytoolGroupController'

        map.connect(
            'group_edit', '/group/edit/{id}',
            controller=group_controller, action='edit'
        )
        map.connect(
            'group_new', '/group/new',
            controller=group_controller, action='new'
        )
        map.connect(
            'group_delete', '/group/delete/{id}',
            controller=group_controller, action='delete'
        )

        # Query tool routes
        map.redirect('/querytool', '/querytool/groups',
                     _redirect_code='301 Moved Permanently')

        map.connect('querytool_groups', '/querytool/groups',
                    _redirect_code='301 Moved Permanently')

        map.connect('querytool_list_by_group', '/group/{id}/reports',
                    controller=group_controller, action='read_report')

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

        map.connect('querytool_misc_groups',
                    '/querytool/public/group/__misc__groups__',
                    controller=querytool_controller,
                    action='querytool_public_list')

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

        user_controller = 'ckanext.querytool.controllers.user:QuerytoolUserController'
        map.connect('login',
                    '/user/login',
                    controller=user_controller,
                    action='login')

        map.connect('logged_in',
                    '/user/logged_in',
                    controller=user_controller,
                    action='logged_in')

        email_auth_controller = 'ckanext.querytool.controllers.email_auth:QuerytoolEmailAuthController'
        map.connect('send_2fa_code',
                    '/send_2fa_code/{user}',
                    controller=email_auth_controller,
                    action='send_2fa_code')

        return map

    def after_map(self, map):
        return map

    # IActions

    def get_actions(self):
        # Disable lru_cache
        module_root = 'ckanext.querytool.logic.action'
        action_functions = h._get_functions(module_root)
        # action_functions['resource_delete'] = actions.resource_delete
        # action_functions['resource_patch'] = actions.resource_patch
        # action_functions['resource_update'] = actions.resource_update
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
            'querytool_get_group_title':
                helpers.get_group_title,
            'querytool_get_map_config':
                helpers.get_map_config,
            'querytool_hex_to_rgba':
                helpers.hex_to_rgba,
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
            'get_edit_permission_for_user':
                helpers.get_edit_permission_for_user,
            'get_user_permission_type':
                helpers.get_user_permission_type,
            'get_is_admin_or_editor_of_any_group':
                helpers.get_is_admin_or_editor_of_any_group,
            'get_orgs_for_user':
                helpers.get_orgs_for_user,
            'get_organization':
                helpers.get_organization,
            'get_datasets_for_user':
                helpers.get_datasets_for_user,
            'get_all_orgs_for_user':
                helpers.get_all_orgs_for_user,
            'get_all_org_permissions':
                helpers.get_all_org_permissions,
            'convert_bar_width':
                helpers.convert_bar_width,
            'get_cookie_control_config':
                helpers.get_cookie_control_config,
            'get_social_media_links':
                helpers.get_social_media_links,
            'querytool_search':
                helpers.querytool_search,
            'report_search_count':
                helpers.report_search_count,
            'filter_reports_by_permissions':
                helpers.filter_reports_by_permissions,
            'filter_groups_by_permissions':
                helpers.group_count_design_reports,
            'color_to_hex':
                helpers.color_to_hex,
            'get_maps_data_formats':
                helpers.get_maps_data_formats,
            'get_available_groups':
                helpers.get_available_groups,
            'get_all_parent_groups':
                helpers.get_all_parent_groups,
            'get_recaptcha_config':
                helpers.get_recaptcha_config,
            'get_config_value':
                helpers.get_config_value,
            'get_all_group_names':
                helpers.get_all_group_names,
            'get_orphaned_reports':
                helpers.get_orphaned_reports,
            'sort_by_orphaned_reports':
                helpers.sort_by_orphaned_reports
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions

    # IConfigurer

    def update_config_schema(self, schema):
        schema.update({
            'ckan.welcome_page_title': [ignore_missing, unicode_safe],
            'ckan.welcome_page_description': [ignore_missing, unicode_safe],
            'theme': [ignore_missing, unicode_safe],
            'header_image_url': [ignore_missing, unicode_safe],
            'header_image_upload': [ignore_missing, unicode_safe],
            'header_clear_upload': [ignore_missing, unicode_safe],
            'header_text_color': [ignore_missing, unicode_safe],
            'footer_logo_image_url': [ignore_missing, unicode_safe],
            'footer_logo_image_upload': [ignore_missing, unicode_safe],
            'footer_logo_clear_upload': [ignore_missing, unicode_safe],
            'footer_logo_text': [ignore_missing, unicode_safe],
            'footer_logo2_image_url': [ignore_missing, unicode_safe],
            'footer_logo2_image_upload': [ignore_missing, unicode_safe],
            'footer_logo2_clear_upload': [ignore_missing, unicode_safe],
            'footer_logo2_text': [ignore_missing, unicode_safe],
            'copyright_text': [ignore_missing, unicode_safe],
            'social_order': [ignore_missing, unicode_safe],
            'facebook_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'instagram_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'linkedin_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'telegram_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'tiktok_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'twitter_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'whatsapp_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'youtube_url': [ignore_missing, unicode_safe, logic.validators.url_validator],
            'group_parents_enabled': [ignore_missing, logic.validators.boolean_validator],
        })

        return schema

    # IClick

    def get_commands(self):
        return [vs_commands.vs]
