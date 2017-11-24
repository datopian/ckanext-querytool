import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit


class QuerytoolPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IRoutes)

    # IConfigurer

    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_public_directory(config_, 'public')
        toolkit.add_resource('fanstatic', 'querytool')

    # IRoutes

    def before_map(self, map):
        ctrl = 'ckanext.querytool.controllers.querytool:QueryToolController'

        map.connect('querytool_edit', '/querytool/edit',
                    controller=ctrl, action='edit')
        map.connect('querytool_index', '/querytool/index',
                    controller=ctrl, action='index')

        return map

    def after_map(self, map):
        return map
