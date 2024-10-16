# encoding: utf-8
import logging
from urllib.parse import urlencode
from flask import Blueprint, request, redirect
from typing import Any, cast, List, Tuple, Optional

import ckan.lib.base as base
import ckan.logic as logic
import ckan.model as model
from ckan.common import config, _, g, current_user
import ckan.lib.helpers as h
import ckan.lib.search as search

from ckan.types import Context

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


querytool_home = Blueprint('querytool_home', __name__)


def index() -> str:
    u'''display home page'''
    extra_vars: dict[str, Any] = {}
    try:
        context = cast(
            Context,
            {
                u'model': model,
                u'session': model.Session,
                u'user': current_user.name,
                u'auth_user_obj': current_user,
            },
        )

        data_dict: dict[str, Any] = {
            u'q': u'*:*',
            u'facet.field': h.facets(),
            u'rows': 4,
            u'start': 0,
            u'sort': u'view_recent desc',
            u'fq': u'capacity:"public"',
        }
        query = logic.get_action(u'package_search')(context, data_dict)
        g.package_count = query['count']
        g.datasets = query['results']

        org_label = h.humanize_entity_type(
            u'organization', h.default_group_type(u'organization'), u'facet label'
        ) or _(u'Organizations')

        group_label = h.humanize_entity_type(
            u'group', h.default_group_type(u'group'), u'facet label'
        ) or _(u'Groups')

        g.facet_titles = {
            u'organization': org_label,
            u'groups': group_label,
            u'tags': _(u'Tags'),
            u'res_format': _(u'Formats'),
            u'license': _(u'Licenses'),
        }

        extra_vars[u'search_facets'] = query[u'search_facets']

    except search.SearchError:
        g.package_count = 0

    if current_user.is_authenticated and not current_user.email:
        url = h.url_for('user.edit')
        msg = _(
            u'Please <a href="%s">update your profile</a>'
            u' and add your email address. '
        ) % url + _(
            u'%s uses your email address' u' if you need to reset your password.'
        ) % config.get(
            u'ckan.site_title'
        )
        h.flash_notice(msg, allow_html=True)
    return base.render(u'querytool/public/base_main.html', extra_vars={'msg': 'Groups'})


def redirect_locale(target_locale: str, path: Optional[str] = None) -> Any:

    target = f'/{target_locale}/{path}' if path else f'/{target_locale}'

    if request.args:
        target += f'?{urlencode(request.args)}'

    return redirect(target, code=308)


util_rules: List[Tuple[str, Any]] = [
    (u'/', index),
]
for rule, view_func in util_rules:
    querytool_home.add_url_rule(rule, view_func=view_func)

locales_mapping: List[Tuple[str, str]] = [
    ('zh_TW', 'zh_Hant_TW'),
    ('zh_CN', 'zh_Hans_CN'),
    ('no', 'nb_NO'),
]

for locale in locales_mapping:

    legacy_locale = locale[0]
    new_locale = locale[1]

    querytool_home.add_url_rule(
        f'/{legacy_locale}/',
        view_func=redirect_locale,
        defaults={'target_locale': new_locale},
    )

    querytool_home.add_url_rule(
        f'/{legacy_locale}/<path:path>',
        view_func=redirect_locale,
        defaults={'target_locale': new_locale},
    )
