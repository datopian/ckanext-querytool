from __future__ import print_function
import logging

from ckan.lib.cli import CkanCommand
import ckan.model as model
from sqlalchemy.sql import select, func
from sqlalchemy import MetaData

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

        connection = model.Session.connection()

        sql = """
        INSERT INTO public."group" (
            id, name, title, description, created, state, revision_id, type,
            approval_status, image_url, is_organization) VALUES (
                'e279a8e7-f0ec-4b0e-989b-4bb72fa69e03', 'steps-survey-1',
                'STEPS Survey', 'WHO STEPwise approach to noncommunicable disease (NCD) risk factor surveillance.',
                '2020-11-18 15:40:12.377591', 'active', 'a2ba7ae8-d636-46b7-8e2b-f6c831bc00de',
                'organization', 'approved', '2020-11-18-184305.396820STEPS.png', true);
        """
        connection.execute(sql)
        model.Session.commit()

        log.error('Seeded portal with test data')
        print('SEEDED')

    def get_table(name):
        meta = MetaData()
        meta.reflect(bind=model.meta.engine)
        table = meta.tables[name]
        return table
