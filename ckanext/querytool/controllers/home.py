# encoding: utf-8
import logging

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, c, _
import ckan.lib.helpers as h
from ckan.controllers.home import HomeController

log = logging.getLogger(__name__)

render = base.render
abort = base.abort

NotFound = logic.NotFound
NotAuthorized = logic.NotAuthorized
ValidationError = logic.ValidationError
check_access = logic.check_access
get_action = logic.get_action
tuplize_dict = logic.tuplize_dict
clean_dict = logic.clean_dict
parse_params = logic.parse_params


class QuerytoolHomeController(HomeController):
    def index(self):
        if c.user:
            try:
                # package search
                context = {'model': model, 'session': model.Session,
                           'user': c.user, 'auth_user_obj': c.userobj}
                data_dict = {
                    'q': '*:*',
                    'facet.field': h.facets(),
                    'rows': 4,
                    'start': 0,
                    'sort': 'views_recent desc',
                    'fq': 'capacity:"public"'
                }
                query = logic.get_action('package_search')(
                    context, data_dict)
                c.search_facets = query['search_facets']
                c.package_count = query['count']
                c.datasets = query['results']

                c.facet_titles = {
                    'organization': _('Organizations'),
                    'groups': _('Groups'),
                    'tags': _('Tags'),
                    'res_format': _('Formats'),
                    'license': _('Licenses'),
                }

            except search.SearchError:
                c.package_count = 0

            if c.userobj and not c.userobj.email:
                url = h.url_for(controller='user', action='edit')
                msg = _('Please <a href="%s">update your profile</a>'
                        ' and add your email address. ') % url + \
                    _('%s uses your email address'
                        ' if you need to reset your password.') \
                    % config.get('ckan.site_title')
                h.flash_notice(msg, allow_html=True)

            return base.render('home/index.html', cache_force=True)
        else:
            querytool_controller \
                = 'ckanext.querytool.controllers.querytool:QueryToolController'
            h.redirect_to(controller=querytool_controller, action='querytool_public')
