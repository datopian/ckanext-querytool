import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckanext.querytool.helpers as h
from ckanext.querytool.model import setup as model_setup
import ckanext.querytool.helpers as helpers


class QuerytoolPlugin(plugins.SingletonPlugin):
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
        storytool_controller = \
            'ckanext.querytool.controllers.storytool:StoryToolController'

        # Query tool controllers
        map.redirect('/querytool', '/querytool/list',
                     _redirect_code='301 Moved Permanently')
        map.connect('querytool_list', '/querytool/list',
                    controller=querytool_controller, action='list')
        map.connect('querytool_show', '/querytool/show/{querytool}',
                    controller=querytool_controller, action='show')
        map.connect('querytool_edit', '/querytool/edit{querytool:/.*|}',
                    controller=querytool_controller, action='querytool_edit')
        map.connect('querytool_delete', '/querytool/delete{querytool:/.*|}',
                    controller=querytool_controller, action='delete')
        map.connect('querytool_edit_visualizations',
                    '/querytool/edit_visualizations{querytool:/.*|}',
                    controller=querytool_controller,
                    action='edit_visualizations')
        map.connect('querytool_public', '/querytool/public',
                    controller=querytool_controller, action='querytool_public')
        map.connect('querytool_public_data', '/querytool/public/data',
                    controller=querytool_controller,
                    action='querytool_public_data')
        map.connect('querytool_public_data_list',
                    '/querytool/public/data/{name}',
                    controller=querytool_controller,
                    action='querytool_public_data_list')

        # Story tool controllers
        map.connect('storytool_public', '/storytool/public/',
                    controller=storytool_controller,
                    action='show')

        return map

    def after_map(self, map):
        return map

    # IActions

    def get_actions(self):
        module_root = 'ckanext.querytool.logic.action'
        action_functions = h._get_functions(module_root)

        return action_functions

    # IConfigurable

    def configure(self, config):
        # Setup querytool model
        model_setup()

    # ITemplateHelpers

    def get_helpers(self):
        return {
            'querytool_get_datasets': helpers.get_all_datasets,
            'querytool_get_filter_values': helpers.get_filter_values,
            'querytool_get_chart_types': helpers.get_chart_types,
            'querytool_get_color_scheme': helpers.get_color_scheme,
            'querytool_get_avaiable_filters': helpers.get_avaiable_filters
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions
