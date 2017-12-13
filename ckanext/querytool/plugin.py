import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
import ckanext.querytool.helpers as h
from ckanext.querytool.model import setup as model_setup


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
        map.connect('querytool_show', '/querytool/show',
                    controller=ctrl, action='show')
        map.connect('querytool_edit', '/querytool/edit',
                    controller=ctrl, action='edit')
        map.connect('querytool_edit_visualizations',
                    '/querytool/edit_visualizations',
                    controller=ctrl, action='edit_visualizations')
        map.connect('querytool_index', '/querytool/index',
                    controller=ctrl, action='index')

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
        }

    # IAuthFunctions

    def get_auth_functions(self):
        module_root = 'ckanext.querytool.logic.auth'
        auth_functions = h._get_functions(module_root)

        return auth_functions
