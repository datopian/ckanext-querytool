import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit
from ckanext.querytool.logic import actions
from ckanext.querytool.model import setup as model_setup

class QuerytoolPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IRoutes)
    plugins.implements(plugins.IActions)
    plugins.implements(plugins.IConfigurable)


    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('fanstatic', 'querytool')


    # IRoutes

    def before_map(self, map):
        ctrl = 'ckanext.querytool.controllers.querytool:QueryToolController'

        map.connect('querytool_show', '/querytool/show',
                    controller=ctrl, action='show')
        map.connect('querytool_edit', '/querytool/edit',
                    controller=ctrl, action='edit')
        map.connect('querytool_index', '/querytool/index',
                    controller=ctrl, action='index')

        return map

    def after_map(self, map):
        return map

    # IActions

    def get_actions(self):
        return {
            'querytool_create_query': actions.create_query
        }

    # IConfigurable

    def configure(self, config):
        # Setup querytool model
        model_setup()