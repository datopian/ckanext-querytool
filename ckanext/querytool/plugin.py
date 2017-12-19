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
        ctrl = 'ckanext.querytool.controllers.querytool:QueryToolController'

        map.redirect('/querytool', '/querytool/list',
                     _redirect_code='301 Moved Permanently')
        map.connect('querytool_list', '/querytool/list',
                    controller=ctrl, action='list')
        map.connect('querytool_show', '/querytool/show/{querytool}',
                    controller=ctrl, action='show')
        map.connect('querytool_edit', '/querytool/edit{querytool:/.*|}',
                    controller=ctrl, action='querytool_edit')
        map.connect('querytool_delete', '/querytool/delete{querytool:/.*|}',
                    controller=ctrl, action='delete')
        map.connect('querytool_edit_visualizations',
                    '/querytool/edit_visualizations',
                    controller=ctrl, action='edit_visualizations')
        map.connect('querytool_public_index', '/querytool/public/index',
                    controller=ctrl, action='querytool_public_index')
        map.connect('querytool_public_list', '/querytool/public/list',
                    controller=ctrl, action='querytool_public_list')

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
            'querytool_get_datasets': helpers.get_all_datasets
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions
