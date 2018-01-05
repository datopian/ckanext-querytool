import ckan.model as model
from ckan.plugins import toolkit
import ckan.lib.base as base
render = base.render


def _get_context():
    context = {'model': model,
               'session': model.Session,
               'user': c.user,
               'for_view': True,
               'with_private': False}

    return context


def _get_action(action, data_dict):
    return toolkit.get_action(action)(_get_context(), data_dict)


class StoryToolController(base.BaseController):

    ctrl = 'ckanext.querytool.controllers.storytool:StoryToolController'

    def show(self):

        return render('storytool/public/base_storytool.html',
                      extra_vars={'data': {}})
