import datetime
import json
import logging
import ckan.logic as logic

from sqlalchemy import Table, Column, Index, ForeignKey
from sqlalchemy import types, func
from sqlalchemy.orm import class_mapper
try:
    from sqlalchemy.engine.result import RowProxy
except ImportError:
    from sqlalchemy.engine.base import RowProxy

from sqlalchemy.engine.reflection import Inspector
from ckan.model.meta import orm, metadata, mapper, Session, engine
from ckan.model.types import make_uuid
from ckan.model.domain_object import DomainObject

log = logging.getLogger(__name__)
query_tool_table = None
query_tool_visualizations_table = None


def setup():
    # Check if query tool table exist
    if query_tool_table is None:
        define_query_tool_table()
        log.debug('Querytool table defined in memory.')
    if not query_tool_table.exists():
        query_tool_table.create()
    else:
        log.debug('Querytool table already exists.')
        # add `owner_org` column if not exists:
        Session.execute('ALTER TABLE ckanext_querytool ADD COLUMN IF NOT EXISTS owner_org TEXT;')
        Session.commit()
    inspector = Inspector.from_engine(engine)

    index_names =\
        [index['name'] for index in
            inspector.get_indexes('ckanext_querytool')]

    if 'ckanext_querytool_id_idx' not in index_names:
        log.debug('Creating index for Querytool.')
        Index('ckanext_querytool_id_idx',
              query_tool_table.c.id).create()

    # Check if query tool visualizations table exist
    if query_tool_visualizations_table is None:
        define_querytool_visualizations_table()
        log.debug('Querytool visualizations table defined in memory.')
    if not query_tool_visualizations_table.exists():
        query_tool_visualizations_table.create()
    else:
        log.debug('Querytool visualizations table already exists.')
    inspector = Inspector.from_engine(engine)

    index_names =\
        [index['name'] for index in
            inspector.get_indexes('ckanext_querytool_visualizations')]

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
                                    default=u''),
                             Column('dataset_name', types.UnicodeText,
                                    nullable=False),
                             Column('chart_resource', types.UnicodeText,
                                    nullable=False),
                             Column('filters', types.UnicodeText,
                                    default=u''),
                             Column('y_axis_columns', types.UnicodeText,
                                    default=u''),
                             Column('sql_string', types.UnicodeText,
                                    default=u''),
                             Column('related_querytools', types.UnicodeText,
                                    default=u''),
                             Column('created', types.DateTime,
                                    default=datetime.datetime.utcnow),
                             Column('modified', types.DateTime,
                                    default=datetime.datetime.utcnow),
                             Column('private', types.Boolean,
                                    default=True),
                             Column('type',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('group',
                                    types.UnicodeText,
                                    nullable=False),
                             Column('owner_org',
                                    types.UnicodeText,
                                    nullable=False),
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
                                        attribute_mapped_collection(u'id'),
                                        cascade='all, delete, delete-orphan',
                                        ),
        )
                    }
    )


def table_dictize(obj, context, **kw):
    '''Get any model object and represent it as a dict'''
    result_dict = {}

    if isinstance(obj, RowProxy):
        fields = obj.keys()
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
            result_dict[name] = unicode(value)

    result_dict.update(kw)

    # HACK For optimisation to get metadata_modified created faster.

    context['metadata_modified'] = max(result_dict.get('revision_timestamp',
                                                       ''),
                                       context.get('metadata_modified', ''))

    return result_dict
