import logging
import ckan.logic.action.delete as delete_core
import ckan.logic.action.patch as patch_core
import ckan.logic.action.update as update_core
from ckanext.querytool import helpers
log = logging.getLogger(__name__)


# Module API

def resource_delete(context, data_dict):
    _clear_get_resource_data_cache()
    return delete_core.resource_delete(context, data_dict)


def resource_patch(context, data_dict):
    _clear_get_resource_data_cache()
    return patch_core.resource_patch(context, data_dict)


def resource_update(context, data_dict):
    _clear_get_resource_data_cache()
    return update_core.resource_update(context, data_dict)


# Internal

def _clear_get_resource_data_cache():
    log.debug('Cache statistics for `helpers.get_resource_data`:')
    log.debug(helpers.get_resource_data.cache_info())
    helpers.get_resource_data.cache_clear()
    log.debug('Cache for `helpers.get_resource_data` has been reset')
