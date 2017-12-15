import logging
import ckan.logic as l

from sqlalchemy import Table, Column, Index, ForeignKey
from sqlalchemy import types, func

from sqlalchemy.engine.reflection import Inspector
from ckan.model.meta import metadata, mapper, Session, engine
from ckan.model.types import make_uuid
from ckan.model.domain_object import DomainObject

log = logging.getLogger(__name__)
query_tool_table = None


def setup():
    if query_tool_table is None:
        define_query_tool_table()
        log.debug('Querytool table defined in memory.')
    if not query_tool_table.exists():
        query_tool_table.create()
    else:
        log.debug('Querytool table already exists.')
    inspector = Inspector.from_engine(engine)

    index_names =\
        [index['name'] for index in
            inspector.get_indexes('ckanext_querytool')]

    if 'ckanext_querytool_id_idx' not in index_names:
        log.debug('Creating index for Querytool.')
        Index('ckanext_querytool_id_idx',
              query_tool_table.c.id).create()


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
            raise l.NotFound

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
                                    default=False),
                             Index('ckanext_querytool_id_idx',
                                   'id'))

    mapper(
        CkanextQueryTool,
        query_tool_table
    )
