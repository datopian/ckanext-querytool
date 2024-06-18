try:
    # CKAN 2.7 and later
    from ckan.common import config
except ImportError:
    # CKAN 2.6 and earlier
    from pylons import config

import logging
import json
import csv
import io
import tempfile

import ckan.logic as logic

from xlsxwriter.workbook import Workbook
from xml.etree.ElementTree import Element, SubElement, ElementTree, tostring
from ckan.common import _

from datetime import date, timedelta, datetime
from decimal import Decimal

DUMP_FORMATS = 'csv', 'json', 'xml', 'xlsx'

NAIVE_DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
DATE_FORMAT = '%Y-%m-%d'
UTF8_BOM = '\uFEFF'.encode('utf-8')

log = logging.getLogger(__name__)


class XMLWriter(object):
    def __init__(self, output, columns):

        self.delimiter = \
            config.get('ckanext.dataextractor.headers_names_delimiter', "_")
        self.output = io.BytesIO(output.getvalue().encode())
        self.id_col = columns[0] == '_id'
        if self.id_col:
            columns = columns[1:]
        columns_fixed = []
        for column in columns:
            columns_fixed.append(column.replace(" ", self.delimiter))
        self.columns = columns_fixed
        self.rows = []
        log.debug(self.columns)

    def writerow(self, row):
        root = Element('row')
        if self.id_col:
            root.attrib['_id'] = str(row[0])
            row = row[1:]
        for k, v in zip(self.columns, row):
            if v is None:
                SubElement(root, k).text = 'NULL'
                continue
            SubElement(root, k).text = str(v)
        self.rows.append(root)


class JSONWriter(object):
    def __init__(self, output, columns):
        self.output = output
        self.columns = columns
        self.first = True

    def writerow(self, row):

        if self.first:
            self.first = False
            self.output.write('\n    ')
        else:
            self.output.write(',\n    ')
        self.output.write(json.dumps(
            row,
            ensure_ascii=False,
            separators=(',', ':'),
            sort_keys=True))


class FileWriterService():
    def _csv_writer(self, fields, records, delimiter):

        d = str(delimiter).lower()

        columns = [x['id'] for x in fields]
        columns_utf8 = [x['id'] for x in fields]

        output = io.StringIO()

        if d == 'semicolon':
            writer = csv.writer(output, delimiter=';')
        elif d == 'pipe':
            writer = csv.writer(output, delimiter='|')
        elif d == 'tab':
            writer = csv.writer(output, dialect='excel-tab')
        else:
            writer = csv.writer(output, delimiter=',')

        # Writing headers
        writer.writerow(columns_utf8)

        # Writing records
        for record in records:
            writer.writerow([record[column]
                             if record[column] is None or
                             type(record[column]) in [int, float]
                             else
                             record[column]
                             for column in columns])

        return io.StringIO(output.getvalue())

    def _json_writer(self, fields, records):

        columns = [x['id'] for x in fields]
        output = io.StringIO()

        output.write(
            '{\n  "fields": %s,\n  "records": [' % json.dumps(
                fields, ensure_ascii=False, separators=(',', ':'))
            )

        # Initiate json writer and columns
        wr = JSONWriter(output, columns)

        # Write records
        for record in records:
            wr.writerow([record[column] for column in columns])

        output.write('\n]}\n')

        return io.StringIO(output.getvalue())

    def _xml_writer(self, fields, records):

        columns = [x['id'] for x in fields]
        output = io.StringIO()

        # Initiate xml writer and columns
        wr = XMLWriter(output, columns)

        # Write records
        for record in records:
            wr.writerow([record[column] for column in columns])

        data = Element('data')
        for row in wr.rows:
            data.append(row)

        xml_string = tostring(data).decode()

        return io.StringIO(xml_string)

    def _xlsx_writer(self, fields, records):

        columns = [x['id'] for x in fields]
        output = io.StringIO()

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            temp_name = tmp.name
            workbook = Workbook(tmp.name)
            worksheet = workbook.add_worksheet()

            # Writing headers
            col = 0
            for c in columns:
                worksheet.write(0, col, c)
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
        with open(temp_name, 'rb') as f:
            content = f.read()
            print(content, flush=True)
            return io.BytesIO(content)

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
        raise logic.ValidationError(_(
            'format: must be one of %s') % ', '.join(DUMP_FORMATS))
