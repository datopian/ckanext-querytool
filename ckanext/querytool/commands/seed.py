from __future__ import print_function
import logging

from ckan.lib.cli import CkanCommand
import ckan.model as model
import ckan.logic as logic
from ckan.plugins import toolkit
from sqlalchemy.sql import select, func
import os
from sqlalchemy import MetaData, text, exc

log = logging.getLogger(__name__)


class SeedData(CkanCommand):
    """Seed the portal with test, organization, groups,
       datasets, reports, and visualizations
    """
    summary = __doc__.split('\n')[0]
    usage = __doc__
    max_args = 0
    min_args = 0

    def command(self):
        self._load_config()
        get_admin = raw_input('\nPlease enter the sysadmin login name: ')

        try:
            admin = toolkit.get_action('user_show')({}, {'id': get_admin})
        except logic.NotFound:
            print('\nERROR: "{}" is not a valid name. Try again.\n'
                  .format(get_admin))
            quit()

        admin_id = str(admin.get('id'))
        user_ids_to_replace = [
            'ac134bd9-4a29-46a4-a51e-32758fbe7270',
            'e13b0500-9a8e-4adf-9cb1-db33668f040f',
            'd0145af1-98e5-49ae-8a6d-44296facb4eb',
            '923edf48-4d96-443f-be39-ad67719e52a3'
        ]

        connection = model.Session.connection()
        current_path = os.path.dirname(__file__)
        seed_path = os.path.join(current_path, '..', 'seed', 'dump.sql')

        sql = ""

        with open(seed_path, 'r') as f:
            sql = f.read()

        for id in user_ids_to_replace:
            sql = sql.replace(id, admin_id)

        try:
            connection.execute(sql)
        except exc.IntegrityError:
            print('\nERROR: The DB has existing data that\'s conflicting with '
                  'this tool. This command must be run on a fresh DB.\n')
            quit()

        model.Session.commit()

        log.info('Successfully seeded the portal with test data!')
        print('\nSuccessfully seeded the portal with test data!\n')

    def get_table(name):
        meta = MetaData()
        meta.reflect(bind=model.meta.engine)
        table = meta.tables[name]
        return table
