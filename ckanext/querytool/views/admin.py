# encoding: utf-8
from __future__ import annotations

import logging
from typing import Union

from flask import Blueprint
from flask.views import MethodView
from flask.wrappers import Response

import ckan.lib.app_globals as app_globals
import ckan.lib.base as base
from ckan.lib.helpers import helper_functions as h
import ckan.model as model
from ckan.common import request


log = logging.getLogger(__name__)


querytool_admin = Blueprint("querytool_admin", __name__, url_prefix="/ckan-admin")


def _get_config_items() -> list[str]:
    return [
        "ckan.welcome_page_title",
        "ckan.welcome_page_description",
        "querytool_theme",
        "header_image_url",
        "header_image_upload",
        "header_clear_upload",
        "header_text_color",
        "footer_logo_image_url",
        "footer_logo_image_upload",
        "footer_logo_clear_upload",
        "footer_logo_text",
        "footer_logo2_image_url",
        "footer_logo2_image_upload",
        "footer_logo2_clear_upload",
        "footer_logo2_text",
        "copyright_text",
        "social_order",
        "facebook_url",
        "instagram_url",
        "linkedin_url",
        "telegram_url",
        "tiktok_url",
        "twitter_url",
        "whatsapp_url",
        "youtube_url",
        "group_parents_enabled",
    ]


class ResetConfigView(MethodView):
    def get(self) -> Union[str, Response]:
        if "cancel" in request.args:
            return h.redirect_to("admin.config")
        return base.render("admin/confirm_reset.html", extra_vars={})

    def post(self) -> Response:
        # remove sys info items
        for item in _get_config_items():
            model.delete_system_info(item)
        # reset to values in config
        app_globals.reset()
        return h.redirect_to("admin.config")


querytool_admin.add_url_rule(
    "/reset_config", view_func=ResetConfigView.as_view(str("reset_config"))
)
