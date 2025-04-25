import datetime
import json
import logging
import pyotp
import sys

from sqlalchemy import Table, Column, Index, ForeignKey, MetaData
from sqlalchemy import types, func, or_
from sqlalchemy.orm import class_mapper

from sqlalchemy.engine import Row as RowProxy
from sqlalchemy import inspect

import ckan.logic as logic
from ckan.model.meta import orm, metadata, mapper, Session, engine
from ckan.model.types import make_uuid
from ckan.model.domain_object import DomainObject
from ckan.model import User
from ckan.model.group import Group
from ckan import model

log = logging.getLogger(__name__)
query_tool_table = None
query_tool_visualizations_table = None


def setup():
    global query_tool_table, query_tool_visualizations_table

    if query_tool_table is None:
        define_query_tool_table()
        log.debug('Querytool table defined in memory.')

    # Bind al engine de CKAN
    query_tool_table.metadata.bind = model.meta.engine

    if not query_tool_table.exists():
        log.debug("Querytool table does not exist. Creating table.")
        query_tool_table.create()
    else:
        log.debug('Querytool table already exists.')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS owner_org TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS icon TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS additional_description TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS image_url TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS image_display_url TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS selection_label TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS report_caption TEXT;')
        model.Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS download_options BOOLEAN;')
        model.Session.commit()

    inspector = inspect(model.meta.engine)
    index_names = [index['name'] for index in inspector.get_indexes('ckanext_querytool')]

    if 'ckanext_querytool_id_idx' not in index_names:
        log.debug('Creating index for Querytool.')
        Index('ckanext_querytool_id_idx', query_tool_table.c.id).create()

    if query_tool_visualizations_table is None:
        define_querytool_visualizations_table()
        log.debug('Querytool visualizations table defined in memory.')

    query_tool_visualizations_table.metadata.bind = model.meta.engine

    if not query_tool_visualizations_table.exists():
        query_tool_visualizations_table.create()
    else:
        log.debug('Querytool visualizations table already exists.')

    index_names = [index['name'] for index in inspector.get_indexes('ckanext_querytool_visualizations')]

    if 'ckanext_querytool_visualizations_id_idx' not in index_names:
        log.debug('Creating index for Querytool visualizations.')
        Index('ckanext_querytool_visualizations_id_idx',
              query_tool_visualizations_table.c.id).create()


class CkanextQueryTool(DomainObject):
    @classmethod
    def get(self, **kwds):
        '''Finds a single entity in the table.
        '''

        query = Session.query(self).autoflush(False)
        query = query.filter_by(**kwds).first()
        return query

    @classmethod
    def search(self, query_string=None, query_group=None, **kwds):
        '''Finds entities in the table that satisfy certain criteria.
        :param order: Order rows by specified column.
        :type order: string
        '''

        query = Session.query(self).autoflush(False)

        if query_string:
            columns = [c.name for c in class_mapper(self).columns]

            # These cause errors and aren't needed for search
            columns.remove('created')
            columns.remove('modified')
            columns.remove('id')
            columns.remove('owner_org')
            columns.remove('icon')
            columns.remove('private')
            columns.remove('download_options')

            query = [query.filter(getattr(self, column).ilike('%' + query_string + '%')).all() for column in columns]
            query = [item for sublist in query for item in sublist]

            if query_group:
                query = [item for item in query if item.group == query_group]

        else:
            query = query.filter_by(**kwds).all()

        return query

    @classmethod
    def delete(cls, id):
        # Delete single event
        obj = Session.query(cls).filter_by(name=id).first()
        if not obj:
            raise logic.NotFound

        Session.delete(obj)
        Session.commit()


def define_query_tool_table():
    global query_tool_table
    query_tool_table = Table('ckanext_querytool', metadata,
                             Column('id', types.UnicodeText,
                                    primary_key=True,
                                    default=make_uuid),
                             Column('name',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('title',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('description', types.UnicodeText,
                                    default=''),
                             Column('dataset_name', types.UnicodeText,
                                    nullable=False),
                             Column('chart_resource', types.UnicodeText,
                                    nullable=False),
                             Column('filters', types.UnicodeText,
                                    default=''),
                             Column('y_axis_columns', types.UnicodeText,
                                    default=''),
                             Column('sql_string', types.UnicodeText,
                                    default=''),
                             Column('related_querytools', types.UnicodeText,
                                    default=''),
                             Column('created', types.DateTime,
                                    default=datetime.datetime.utcnow),
                             Column('modified', types.DateTime,
                                    default=datetime.datetime.utcnow),
                             Column('private', types.Boolean,
                                    default=True),
                             Column('type',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('icon',
                                    types.UnicodeText,
                                    nullable=True),
                             Column('image_url',
                                    types.UnicodeText,
                                    nullable=True),
                             Column('image_display_url',
                                    types.UnicodeText,
                                    nullable=True),
                             Column('group',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('owner_org',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('additional_description', types.UnicodeText,
                                    default=''),
                             Column('selection_label', types.UnicodeText,
                                    default=''),
                             Column('report_caption', types.UnicodeText,
                                    default=''),
                             Column('download_options', types.Boolean,
                                    default=True),
                             Index('ckanext_querytool_id_idx',
                                   'id'))

    mapper(
        CkanextQueryTool,
        query_tool_table
    )


class CkanextQueryToolVisualizations(DomainObject):
    @classmethod
    def get(self, **kwds):
        '''Finds a single entity in the table.
        '''

        query = Session.query(self).autoflush(False)
        query = query.filter_by(**kwds).first()
        return query

    @classmethod
    def search(self, **kwds):
        '''Finds entities in the table that satisfy certain criteria.
        :param order: Order rows by specified column.
        :type order: string
        '''

        query = Session.query(self).autoflush(False)
        query = query.filter_by(**kwds)

        return query.all()

    @classmethod
    def delete(cls, id):
        # Delete single event
        obj = Session.query(cls).filter_by(name=id).first()
        if not obj:
            raise logic.NotFound

        Session.delete(obj)
        Session.commit()


def define_querytool_visualizations_table():
    global query_tool_visualizations_table

    query_tool_visualizations_table = \
        Table('ckanext_querytool_visualizations', metadata,
              Column('id', types.UnicodeText,
                     primary_key=True,
                     default=make_uuid),
              Column('ckanext_querytool_id', types.UnicodeText,
                     ForeignKey('ckanext_querytool.id')),
              Column('name',
                     types.UnicodeText,
                     nullable=False),
              Column('visualizations',
                     types.UnicodeText,
                     nullable=False),
              Column('y_axis_column',
                     types.UnicodeText,
                     nullable=False),
              Index('ckanext_querytool_visualizations_id_idx',
                    'id'))

    mapper(
        CkanextQueryToolVisualizations,
        query_tool_visualizations_table,
        properties={'ckanext_querytool': orm.relation(CkanextQueryTool,
                    backref=orm.backref('ckanext_querytool_visualizations',
                                        collection_class=orm.collections.
                                        attribute_mapped_collection('id'),
                                        cascade='all, delete, delete-orphan',
                                        ),
        )
                    }
    )


def table_dictize(obj, context, **kw):
    '''Get any model object and represent it as a dict'''
    result_dict = {}

    if isinstance(obj, RowProxy):
        fields = list(obj.keys())
    else:
        ModelClass = obj.__class__
        table = class_mapper(ModelClass).mapped_table
        fields = [field.name for field in table.c]

    for field in fields:
        name = field
        if name in ('current', 'expired_timestamp', 'expired_id'):
            continue
        if name == 'continuity_id':
            continue
        value = getattr(obj, name)
        if name == 'extras' and value:
            result_dict.update(json.loads(value))
        elif value is None:
            result_dict[name] = value
        elif isinstance(value, dict):
            result_dict[name] = value
        elif isinstance(value, int):
            result_dict[name] = value
        elif isinstance(value, datetime.datetime):
            result_dict[name] = value.isoformat()
        elif isinstance(value, list):
            result_dict[name] = value
        else:
            result_dict[name] = str(value)

    result_dict.update(kw)

    # HACK For optimisation to get metadata_modified created faster.

    context['metadata_modified'] = max(result_dict.get('revision_timestamp',
                                                       ''),
                                       context.get('metadata_modified', ''))

    return result_dict


def child_group_search(query_string=None, query_children=None, misc_group=False):
    '''Finds entities in the table that satisfy certain criteria.
    :param order: Order rows by specified column.
    :type order: string
    '''
    query_children = query_children.split(',') if query_children else []
    group = model.Group
    query = Session.query(group).autoflush(False)

    if query_string:
        query = query.filter(or_(
            group.name.ilike('%' + query_string + '%'),
            group.title.ilike('%' + query_string + '%'),
            group.description.ilike('%' + query_string + '%')
        ))

    if query_children:
        query = query.filter(group.name.in_(query_children))

    if misc_group:
        misc_groups = logic.get_action('get_available_groups')({}, {})
        misc_groups = [
            g['name'] for g in misc_groups
            if g['group_relationship_type'] != 'parent'
        ]
        query = query.filter(group.name.in_(misc_groups))

    results = query.all()

    return results


def child_group_report_search(query_string=None, query_children=None):
    '''Finds entities in the table that satisfy certain criteria.
    :param order: Order rows by specified column.
    :type order: string
    '''
    querytool = get_table('ckanext_querytool')
    query = Session.query(querytool).autoflush(False)
    children = query_children.split(',') if query_children else []

    if query_string:
        query = query.filter(or_(
            querytool.c.name.ilike('%' + query_string + '%'),
            querytool.c.title.ilike('%' + query_string + '%'),
            querytool.c.description.ilike('%' + query_string + '%'),
            querytool.c.additional_description.ilike('%' + query_string + '%'),
            querytool.c.dataset_name.ilike('%' + query_string + '%')
        ))

    results = []

    for q in query:
        if q.group in children:
            results.append(q)

    results = [dict(list(zip(list(result.keys()), result))) for result in results]

    return results


def get_table(name):
    meta = MetaData()
    meta.reflect(bind=model.meta.engine)
    table = meta.tables[name]
    return table


class VitalsSecurityTOTP(DomainObject):
    user_security_totp = None

    def save(self):
        session = model.Session()
        session.add(self)
        session.commit()

    @classmethod
    def create_for_user(cls, user_name, created_at=None):
        """
        Set up the
        :param user_name:
        :return:  VitalsSecurityTOTP model -- saved
        """
        # if class is not initialized, initialize it
        if cls.user_security_totp is None:
            cls.user_security_totp = VitalsSecurityTOTP()
            cls.user_security_totp.define_security_tables()

        if user_name is None:
            raise ValueError("User name parameter must be supplied")

        new_secret = pyotp.random_base32()
        user = VitalsSecurityTOTP.Session.query(User).filter(
            User.name == user_name).first()
        user_id = user.id
        security_challenge = VitalsSecurityTOTP.Session.query(
            VitalsSecurityTOTP).filter(
                VitalsSecurityTOTP.user_id == user_id).first()
        if security_challenge is None:
            security_challenge = VitalsSecurityTOTP(
                user_id=user_id, secret=new_secret, created_at=created_at
            )
        else:
            security_challenge.secret = new_secret
            security_challenge.created_at = created_at
            
        security_challenge.save()

        return security_challenge

    @classmethod
    def get_for_user(cls, user_name):
        '''Finds a securityTOTP object using the user name
        :raises ValueError if the user_name is not provided
        '''
        if cls.user_security_totp is None:
            cls.user_security_totp = VitalsSecurityTOTP()
            cls.user_security_totp.define_security_tables()

        if user_name is None:
            raise ValueError("User name parameter must be supplied")

        challenger = VitalsSecurityTOTP.Session.query(VitalsSecurityTOTP)\
            .join(User, User.id == VitalsSecurityTOTP.user_id) \
            .filter(User.name == user_name).first()

        return challenger

    def check_code(self, code, created_at, user_id):
        """ Checks that a one time password is correct against the model
        :return boolean true if the code is valid
        """
        totp = pyotp.TOTP(self.secret)
        time_diff = (datetime.datetime.utcnow() - created_at).seconds > 600

        if time_diff:
            return False

        result = totp.verify(code, for_time=created_at)

        if not result:
            log.debug("Failed to verify the totp code")

        return result

    def __str__(self):
        return self.__repr__().encode('ascii', 'ignore')

    def define_security_tables(self):
        self.user_security_totp = Table(
            'user_security_totp', metadata,
            Column('id', types.Integer, primary_key=True),
            Column('user_id', types.UnicodeText, default=''),
            Column('secret', types.UnicodeText, default=''),
            Column('created_at', types.DateTime)
        )

        mapper(
            VitalsSecurityTOTP,
            self.user_security_totp
        )

    def totp_db_setup(self):
        if self.user_security_totp is None:
            self.define_security_tables()

        if not model.package_table.exists():
            print(
                "Exiting: can not initialize the TOTP DB "
                "if the CKAN database does not exist yet"
            )
            sys.exit(1)
            return
        self.user_security_totp.drop(checkfirst=True)

        if not self.user_security_totp.exists():
            self.user_security_totp.create()
            print("Created TOTP authentication table")
        else:
            print("TOTP authentication table already exists -- skipping")
