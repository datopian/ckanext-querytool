import logging

import ckan.logic as logic

_get_action = logic.get_action


log = logging.getLogger(__name__)


def handle_group_children(group, group_children, update_type=None):
    for child in group_children:
        child_group = get_group_for_relationship(child)

        child_group_parent = child_group.get('parent')

        if update_type == 'remove':
            if child_group_parent == group.name:
                child_group['parent'] = ''
        elif update_type == 'add':
            if child_group_parent != group.name:
                child_group['parent'] = group.name

        update_related_group(child_group, 'child')


def handle_group_parents(group, group_parent, is_extras=False):
        parent_group = get_group_for_relationship(group_parent)

        parent_group_children = parent_group.get('children')

        if parent_group_children:
            parent_group_children = parent_group_children.split(',')

            if is_extras is True:
                if group.name in parent_group_children:
                    parent_group_children.remove(group.name)
            else:
                if group.name not in parent_group_children:
                    parent_group_children.append(group.name)
        else:
            if is_extras is True:
                parent_group_children = []
            else:
                parent_group_children = [group.name]

        parent_group_children = ','.join(parent_group_children)
        parent_group['children'] = parent_group_children

        update_related_group(parent_group, 'parent')


def get_group_for_relationship(package_id):
    context = {
        'ignore_auth': True,
        'include_extras': True,
        'all_fields': True
    }

    return _get_action('group_show')(context, {'id': package_id})


def update_related_group(group, relationship_type):
    context = {
        'ignore_auth': True,
        'include_extras': True,
        'all_fields': True,
        'is_relationship': True
    }

    group['group_relationship_type'] = relationship_type

    return _get_action('group_update')(context, group)
