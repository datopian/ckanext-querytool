try:
    # CKAN 2.7 and later
    from ckan.common import config
except ImportError:
    # CKAN 2.6 and earlier
    from pylons import config

import logging
import json
import csv
import cStringIO

import ckan.logic as l

from xlsxwriter.workbook import Workbook
from xml.etree.cElementTree import Element, SubElement, ElementTree
from ckan.common import _

from datetime import date, timedelta, datetime
from decimal import Decimal

DUMP_FORMATS = 'csv', 'json', 'xml', 'xlsx'

NAIVE_DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
DATE_FORMAT = '%Y-%m-%d'
UTF8_BOM = u'\uFEFF'.encode(u'utf-8')

log = logging.getLogger(__name__)


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            return json.JSONEncoder.default(self, obj)
        except TypeError:
            if type(obj) is date:
                return obj.strftime(DATE_FORMAT)

            if type(obj) is datetime:
                return obj.strftime(NAIVE_DATETIME_FORMAT)

            if type(obj) is timedelta:
                # return it as rounded milliseconds
                return int(obj.total_seconds() * 1000)

            if type(obj) is Decimal:
                return str(obj)

            raise


class XMLWriter(object):
    def __init__(self, output, columns):

        self.delimiter = \
            config.get('ckanext.dataextractor.headers_names_delimiter', "_")
        self.output = output
        self.id_col = columns[0] == u'_id'
        if self.id_col:
            columns = columns[1:]
        columns_fixed = []
        for column in columns:
            columns_fixed.append(column.replace(" ", self.delimiter))
        self.columns = columns_fixed
        log.debug(self.columns)

    def writerow(self, row):
        root = Element(u'row')
        if self.id_col:
            root.attrib[u'_id'] = unicode(row[0])
            row = row[1:]
        for k, v in zip(self.columns, row):
            if v is None:
                SubElement(root, k).text = u'NULL'
                continue
            SubElement(root, k).text = unicode(v)
        ElementTree(root).write(self.output, encoding=u'utf-8')
        self.output.write(b'\n')


class JSONWriter(object):
    def __init__(self, output, columns):
        self.output = output
        self.columns = columns
        self.first = True

    def writerow(self, row):

        if self.first:
            self.first = False
            self.output.write(b'\n    ')
        else:
            self.output.write(b',\n    ')
        self.output.write(json.dumps(
            row,
            ensure_ascii=False,
            separators=(u',', u':'),
            sort_keys=True,
            cls=CustomJSONEncoder).encode('utf-8'))


class FileWriterService():
    def _csv_writer(self, fields, records, delimiter):

        d = str(delimiter).lower()
        columns = [x['id'].encode("utf-8") for x in fields]
        output = cStringIO.StringIO()

        if d == 'semicolon':
            writer = csv.writer(output, delimiter=';')
        elif d == 'pipe':
            writer = csv.writer(output, delimiter='|')
        elif d == 'tab':
            writer = csv.writer(output, dialect='excel-tab')
        else:
            writer = csv.writer(output, delimiter=',')

        # Writing headers
        writer.writerow([f['id'].encode("utf-8") for f in fields])

        # Writing records
        for record in records:
            writer.writerow([record[column] for column in columns])

        return cStringIO.StringIO(output.getvalue())

    def _json_writer(self, fields, records):

        columns = [x['id'].encode("utf-8") for x in fields]
        output = cStringIO.StringIO()

        output.write(
            b'{\n  "fields": %s,\n  "records": [' % json.dumps(
                fields, ensure_ascii=False, separators=(u',', u':'))
            .encode(u'utf-8'))

        # Initiate json writer and columns
        wr = JSONWriter(output, [f['id'].encode("utf-8") for f in fields])

        # Write records
        for record in records:
            wr.writerow([record[column] for column in columns])

        output.write(b'\n]}\n')

        return cStringIO.StringIO(output.getvalue())

    def _xml_writer(self, fields, records):

        columns = [x['id'].encode("utf-8") for x in fields]
        del columns[1]
        del columns[2]
        output = cStringIO.StringIO()

        output.write(b'<data>\n')

        # Initiate xml writer and columns
        wr = XMLWriter(output, [f['id'] for f in fields])

        # Write records
        for record in records:
            wr.writerow([record[column] for column in columns])

        output.write(b'</data>\n')

        return cStringIO.StringIO(output.getvalue())

    def _xlsx_writer(self, fields, records):

        columns = [x['id'].encode("utf-8") for x in fields]
        output = cStringIO.StringIO()

        workbook = Workbook(output)
        worksheet = workbook.add_worksheet()

        # Writing headers
        col = 0
        for f in fields:
            worksheet.write(0, col, f['id'])
            col += 1

        # Writing records
        row = 1
        for record in records:
            col = 0
            for column in columns:
                worksheet.write(row, col, record[column])
                col += 1
            row += 1

        workbook.close()
        return cStringIO.StringIO(output.getvalue())

    def write_to_file(self, fields, records, format, delimiter):

        format = format.lower()
        if format == 'csv':
            return self._csv_writer(fields, records, delimiter)
        if format == 'json':
            return self._json_writer(fields, records)
        if format == 'xml':
            return self._xml_writer(fields, records)
        if format == 'xlsx':
            return self._xlsx_writer(fields, records)
        raise l.ValidationError(_(
            u'format: must be one of %s') % u', '.join(DUMP_FORMATS))
