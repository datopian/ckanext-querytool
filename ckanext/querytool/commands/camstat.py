# -*- coding: utf-8 -*-

from __future__ import print_function
import requests
import csv
import datetime
import sys
from cgi import FieldStorage
import tempfile
import hashlib
from sqlalchemy import Table, Column
from sqlalchemy import types

from ckan.lib.cli import CkanCommand
from ckan.lib.munge import munge_name
from ckan.plugins import toolkit
from ckan.logic import NotFound
from ckan.model.meta import metadata
from ckan.model.types import make_uuid
from ckan import model

reload(sys)
sys.setdefaultencoding('utf-8')

DATASETS_URL = 'https://sdmx-faceted-search-camstat-live.officialstatistics.org/api/search'


class UpdateCamstat(CkanCommand):
    '''
    Retrieves data from the Camstat website topic "Health and Nutrition",
    cleans it, and creates datasets and resources in CKAN if they don't exist.
    If they do exist, it compares the new checksum with a stored checksum and
    updates them if there are changes.
    '''

    summary = __doc__.split('\n')[0]
    usage = __doc__
    max_args = 0
    min_args = 0

    def command(self):
        self._load_config()
        self.owner_org = 'camstat'
        self.languages = ['en', 'km']

        print('\n  ======================================\n')

        # The following functions can be
        # used for testing and debugging
        #
        # purge_datasets(self.owner_org)
        # purge_organization(self.owner_org)
        # drop_table()

        if not model.Session.bind.has_table('camstat_hashes'):
            self.setup_tables()

            print('> HASH TABLE CREATED SUCCESSFULLY.')

        else:
            print('> HASH TABLE ALREADY EXISTS.')

        print('\n  ======================================\n')

        update_camstat(self.owner_org, self.languages)

    def setup_tables(self):
        model.Session.remove()
        model.Session.configure(bind=model.meta.engine)

        Table(
            'camstat_hashes',
            metadata,
            Column(
                'package_id',
                types.UnicodeText,
                primary_key=True,
                default=make_uuid
            ),
            Column(
                'name',
                types.UnicodeText,
                nullable=False
            ),
            Column(
                'resource_id',
                types.UnicodeText,
                nullable=False
            ),
            Column(
                'hash',
                types.UnicodeText,
                nullable=False
            ),
            Column(
                'last_updated',
                types.DateTime,
                nullable=False
            ))

        print('> CREATING HASH TABLE...')

        metadata.create_all(model.meta.engine)


def purge_datasets(owner_org):
    print(
        '> PURGING ALL DATASETS FOR ORGANIZATION: {}\n'
        .format(owner_org)
    )

    datasets = toolkit.get_action('package_search')({}, {'rows': 1000})
    i = 0

    for dataset in datasets['results']:
        if dataset['organization']['name'] == owner_org:
            print('  + Purging dataset: {}'.format(dataset['name']))

            i += 1

            toolkit.get_action('dataset_purge')({}, dataset)

    print('\n> PURGED {} DATASETS.'.format(i))
    print('\n  ======================================\n')


def drop_table():
    print('> DROPPING HASH TABLE...')

    connection = model.Session.connection()

    sql = 'DROP TABLE "camstat_hashes"'

    connection.execute(sql)
    model.Session.commit()

    print('> HASH TABLE DROPPED SUCCESSFULLY.')
    print('\n  ======================================\n')


def purge_organization(owner_org):
    print('> PURGING ORGANIZATION: {}'.format(owner_org))

    try:
        toolkit.get_action('organization_purge')({}, {'id': owner_org})

        print('> ORGANIZATION PURGED.\n')

    except NotFound:
        print('> ORGANIZATION NOT FOUND. SKIPPING\n')

    print('  ======================================\n')


def utf_8_encoder(unicode_csv_data):
    for line in unicode_csv_data:
        yield line.encode('utf-8')


def clean_csv(data, id_removal, dataflow_agency,
              dataflow_id, dataflow_version):
    print('  + Cleaning CSV data for: {}'.format(dataflow_id))

    cleaned = 0
    ref_area = {}
    ref_area_index = None

    for i in range(len(data)):
        if i <= len(id_removal):
            for j in range(len(data[i])):
                to_be_removed = id_removal[i][j] + ': '

                # Add REF_AREA value to dictionary
                if j == ref_area_index:
                    ref_area[i] = id_removal[i][j]

                # Set index of REF_AREA column
                if id_removal[i][j] == 'REF_AREA':
                    ref_area_index = j

                # Reformat dataflow ID
                if '{}:{}'.format(dataflow_agency, dataflow_id) in data[i][j]:
                    data[i][j] = '{} ({})'.format(
                        dataflow_id,
                        dataflow_version
                    )
                    cleaned += 1

                # Remove ID
                if to_be_removed in data[i][j]:
                    data[i][j] = data[i][j].replace(
                        to_be_removed, ''
                    )
                    cleaned += 1

                # Clean up NA values
                if data[i][j] == 'NA':
                    data[i][j] = ''
                    cleaned += 1
                    continue

                # Wrap strings with commas in quotes
                if ',' in data[i][j]:
                    data[i][j] = '"{}"'.format(data[i][j])
                    cleaned += 1

                # Convert headers to title case
                if data[i][j] == 'DATAFLOW':
                    data[i][j] = data[i][j].title()
                    cleaned += 1

                if data[i][j] == 'OBS_VALUE':
                    data[i][j] = 'Observation value'
                    cleaned += 1

    # Remove empty columns
    for i in range(len(data[0]) -1, -1, -1):
        if all(row[i] == '' for row in data[1:]):
            print('  + Removing empty column: {}'.format(data[0][i]))

            for j in range(len(data)):
                data[j].pop(i)

            cleaned += 1

    # Add REF_AREA column back into cleaned data
    data[0].append('REF_AREA')

    for key, value in ref_area.items():
        data[key].append(value)
        cleaned += 1

    if cleaned > 0:
        print('  + Successfully cleaned {} items.\n'.format(cleaned))

    else:
        print('  + Done. {} items to clean.\n'.format(cleaned))

    return data


def compare_hashes(existing_hash, new_hash):
    print('  + Comparing hashes...')
    print('  + Existing hash: {}'.format(existing_hash))
    print('  + New hash: {}'.format(new_hash))

    if existing_hash == new_hash:
        print('  + Hashes match. No updates required.\n')

        return False

    else:
        print('  + Hashes do not match. Update required.\n')

        return True


def upload_resource(dataflow_name_munged, dataflow_title, resource):
    print('  + Uploading resource to dataset: {}'.format(dataflow_title))

    try:
        resource['package_id'] = dataflow_name_munged
        resource['name'] = dataflow_title
        resource_dict = toolkit.get_action('resource_create')(
            {},
            resource
        )

        print('  + Resource uploaded successfully.')

        return resource_dict

    except Exception as e:
        print('\n! Error uploading resource: {}'.format(e))

    print('  + Resource uploaded successfully.')


def patch_resource(dataflow_name_munged, dataflow_title, resource, resource_id):
    print('  + Updating resource: {}'.format(dataflow_title))

    try:
        resource['id'] = resource_id
        resource['package_id'] = dataflow_name_munged
        resource['name'] = dataflow_title
        resource_dict = toolkit.get_action('resource_patch')(
            {},
            resource
        )

        print('  + Resource updated successfully.')

        return resource_dict

    except Exception as e:
        print('\n! Error updating resource: {}'.format(e))

        return {}


def create_dataset(dataflow_name_munged, owner_org,
                   dataflow_title, dataflow_description):
    print('  + Creating dataset: {}'.format(dataflow_name_munged))

    try:
        toolkit.get_action('package_show')({}, {'id': dataflow_name_munged})
        print('  + Dataset exists...')

    except NotFound:
        dataset_dict = toolkit.get_action('package_create')(
            {},
            {
                'title': dataflow_title,
                'owner_org': owner_org,
                'name': dataflow_name_munged,
                'notes': dataflow_description
            }
        )

        print('  + Dataset created successfully: {}\n'.format(
            dataflow_name_munged
        ))

        return dataset_dict

    except Exception as e:
        print('\n! Error creating dataset: {}\n'.format(e))

        return {}


def patch_dataset(dataflow_name_munged, owner_org,
                  dataflow_title, dataflow_description):
    print('  + Updating dataset: {}'.format(dataflow_name_munged))

    try:
        toolkit.get_action('package_patch')(
            {},
            {
                'id': dataflow_name_munged,
                'notes': dataflow_description
            }
        )

    except NotFound:
        print('  + Dataset does not exist...')

        create_dataset(dataflow_name_munged, owner_org,
                       dataflow_title, dataflow_description)

    except Exception as e:
        print('\n! Error updating dataset: {}\n'.format(e))


def verify_organization_exists(owner_org):
    print('> VERIFYING ORGANIZATION {} EXISTS...'.format(owner_org))

    try:
        toolkit.get_action('organization_show')({}, {'id': owner_org})

        print('> ORGANIZATION EXISTS.')

    except NotFound:
        print('> ORGANIZATION DOESN\'T EXIST...')
        print('> CREATING ORGANIZATION...'.format(owner_org))

        toolkit.get_action('organization_create')(
            {},
            {
                'name': owner_org,
                'title': owner_org.title()
            }
        )

        print('> ORGANIZATION CREATED.')


def prepare_dataflow_description(dataflow_description, dataflow_id,
                                 dataflow_last_extracted):
    print('\n  + Preparing description...')

    if dataflow_description:
        dataflow_description = \
            ('{}\n\n\n**Extracted from**: _{}_\n\n\n**Last extracted**: _{}_'
             .format(dataflow_description,
                     dataflow_id,
                     dataflow_last_extracted
                     )
             )

    else:
        dataflow_description = \
            '**Extracted from**: _{}_\n\n\n**Last extracted**: {}'.format(
                dataflow_id, dataflow_last_extracted
            )

    print('  + Description prepared successfully.\n')

    return dataflow_description


def get_data(dataflow_agency, dataflow_id,
             dataflow_version, data_type):
    if data_type == 'both':
        print('  + Retrieving raw data...')

    else:
        print('  + Retrieving values to be cleaned...')

    data = []

    data_url = \
        (
            'https://nsiws-stable-camstat-live.officialstatistics'
            '.org/rest/data/{},{},{}/all?dimensionAtObservation='
            'AllDimensions').format(
                dataflow_agency,
                dataflow_id,
                dataflow_version
        )

    data_headers = {
        'Accept': 'application/vnd.sdmx.data+csv;file=true;labels={}'.format(
            data_type
        )
    }

    try:
        data_req = requests.get(data_url, headers=data_headers)

        for line in csv.reader(data_req.text.splitlines(),
                               delimiter=',', quotechar='"'):
            data.append(line)

        if data_type == 'both':
            print('  + Raw data retrieved successfully.\n')

        else:
            print('  + Values to be cleaned retrieved successfully.\n')

    except Exception as e:
        print('\n! Error retrieving raw data: {}\n'.format(e))

    return data


def write_csv(data, csv_filename):
    print('  + Writing CSV data to temporary file...')

    tmp_file = tempfile.NamedTemporaryFile('w+b')

    with open(tmp_file.name, 'w+b') as f:
        writer = csv.writer(f)

        for row in data:
            writer.writerow(row)

    tmp_file.seek(0)
    file_obj = FieldStorage()
    file_obj.file = tmp_file
    file_obj.filename = csv_filename

    resource = {
        'url_type': None,
        'url': '',
        'upload': file_obj
    }

    print('  + CSV data written to temporary file successfully.\n')

    return resource


def get_dataflows():
    print(
        '\n  ======================================\n\n'
        '> RETRIEVING DATAFLOWS...'
    )

    datasets_url = DATASETS_URL

    request_payload = {
        'lang': 'en',
        'search': '',
        'facets': {
            '6nQpoAP': [
                '0|Health and Nutrition#HEALTH_NUT#'
            ],
            'datasourceId': [
                'CamStat-stable'
            ]
        },
        'rows': 100,
        'start': 0
    }

    # if language == 'km':
    #     request_payload = {
    #         'lang': 'km',
    #         'search': '',
    #         'facets': {
    #             '2qVbh9uoTLZhK4lguOs1eeVX6FY2aYnOp': [
    #                 '0|សុខាភិបាលនិងអាហារូបត្ថម្#HEALTH_NUT#'
    #             ],
    #             'datasourceId': [
    #                 'CamStat-stable'
    #             ]
    #         },
    #         'rows': 100,
    #         'start': 0
    #     }

    try:
        datasets_page = requests.post(datasets_url, json=request_payload)
        dataflows = datasets_page.json()

        print('> DATAFLOWS RETRIEVED SUCCESSFULLY.\n\n'
              '  ======================================\n'
        )

        return dataflows['dataflows']

    except Exception as e:
        print('\n! Unable to retrieve dataflows: {}\n'.format(e))

        return []


# def get_combined_data(data_en, data_km):
#     print('  + Merging data...')
# 
#     if len(data_en) == len(data_km):
#         for i in range(len(data_en) - 1):
#             for j in range(len(data_en[i]) - 1):
#                 field_en = data_en[i][j]
#                 field_km = data_km[i][j]
# 
#                 if field_km == '' and field_en != '':
#                     data_km[i][j] = data_en[i][j]
# 
#     print('  + Data merged successfully.\n')
# 
#     return data_km


def get_new_hash(data):
    print('  + Generating new hash...')

    new_hash = hashlib.sha256(str(data).encode('utf-8')).hexdigest()

    print('  + New hash generated successfully: {}\n'.format(new_hash))

    return new_hash


def get_existing_hash(dataflow_id):
    print('  + Retrieving existing hash for: {}'.format(dataflow_id))

    connection = model.Session.connection()

    sql = """
        SELECT * FROM "camstat_hashes"
        WHERE "package_id" = '{}'
    """.format(dataflow_id)

    hash_row = connection.execute(sql)

    try:
        row = hash_row.fetchone().items()
        existing_hash = row[3][1]
        resource_id = row[2][1]

        print('  + Hash retrieved successfully: {}\n'.format(existing_hash))

    except Exception as e:
        print('  + Hash doesn\'t exist in DB yet...\n')

        existing_hash = None
        resource_id = None

    return existing_hash, resource_id


def update_hash(dataflow_id, dataflow_name_munged, resource_id,
                new_hash, dataflow_last_updated, existing_hash, was_deleted):
    print('  + Updating hashes...')

    connection = model.Session.connection()

    if existing_hash is None:
        sql = """
            INSERT INTO "camstat_hashes"
            ("package_id", "name", "resource_id", "hash", "last_updated")
            VALUES ('{}', '{}', '{}', '{}', '{}')
        """.format(
            dataflow_id, dataflow_name_munged,
            resource_id, new_hash, dataflow_last_updated
        )

    elif was_deleted:
        sql = """
            UPDATE "camstat_hashes"
            SET "hash" = '{}', "last_updated" = '{}',
            "resource_id" = '{}'
            WHERE "package_id" = '{}' AND "hash" = '{}'
        """.format(
            new_hash, dataflow_last_updated, resource_id,
            dataflow_id, existing_hash
        )

    else:
        sql = """
            UPDATE "camstat_hashes"
            SET "hash" = '{}', "last_updated" = '{}'
            WHERE "package_id" = '{}' AND "resource_id" = '{}'
        """.format(
            new_hash, dataflow_last_updated,
            dataflow_id, resource_id
        )

    connection.execute(sql)
    model.Session.commit()

    print('  + Hashes updated successfully.\n')


def update_camstat(owner_org, languages):
    verify_organization_exists(owner_org)

    # languages = ['km', 'en']
    # lang_km = languages[0]
    lang_en = languages[1]
    dataflows = get_dataflows()

    i = 0

    for dataflow in dataflows:
        dataflow_id = dataflow['dataflowId']
        dataflow_name = dataflow['name']
        dataflow_title = dataflow_name.title()
        dataflow_agency = dataflow['agencyId']
        dataflow_description = dataflow.get('description')
        dataflow_last_updated = datetime.datetime.utcnow()
        dataflow_last_extracted = dataflow_last_updated.strftime(
            '%Y-%m-%d %I:%M %p (UTC)'
        )

        print('> BEGINNING EXTRACTION FOR: {}\n'.format(dataflow_title))
        print('  + Extraction timestamp: {}\n'.format(
            dataflow_last_extracted
        ))

        for key, value in dataflow.items():
            print('  | {}: {}'.format(key, value))

        dataflow_description_updated = prepare_dataflow_description(
            dataflow_description,
            dataflow_id,
            dataflow_last_extracted
        )
        dataflow_version = dataflow.get('version', '1.0')
        dataflow_dataset_name = '{}-{}'.format(
            dataflow_agency,
            dataflow_id.replace('DF_', '')
        ).replace('_', '-')
        dataflow_name_munged = munge_name(dataflow_dataset_name)
        csv_filename = '{}_{}_{}.csv'.format(
            dataflow_agency, dataflow_id, lang_en
        )

        id_removal_en = get_data(
            dataflow_agency,
            dataflow_id,
            dataflow_version,
            'id'
        )
        raw_data_en = get_data(
            dataflow_agency,
            dataflow_id,
            dataflow_version,
            'both'
        )

        # id_removal_km = get_data(
        #     dataflow_agency,
        #     dataflow_id,
        #     dataflow_version,
        #     lang_km,
        #     'id'
        # )
        # raw_data_km = get_data(
        #     dataflow_agency,
        #     dataflow_id,
        #     dataflow_version,
        #     lang_km,
        #     'both'
        # )

        data_en = clean_csv(
            raw_data_en,
            id_removal_en,
            dataflow_agency,
            dataflow_id,
            dataflow_version
        )

        # data_km = clean_csv(
        #     raw_data_km,
        #     id_removal_km,
        #     dataflow_agency,
        #     dataflow_id,
        #     dataflow_version,
        #     'Khmer'
        # )

        # combined_data = get_combined_data(data_en, data_km)

        # To test hash checking and updating, the easiest way is to
        # add test data to 'combined_data'. For example, to add a new
        # row to 'combined_data', you can uncomment the following
        # or do something similar:
        #
        # data_en = [data_en[0]] + [[
        #     "KH_NIS:DF_NUTRITION(1.0)",
        #     "TEST INDICATOR",
        #     "TEST REF AREA",
        #     "TEST SEX",
        #     "TEST LOCATION",
        #     "TEST AGE GROUP",
        #     "TEST VACCINE",
        #     "TEST HEALTH CARE PROVIDER",
        #     "TEST CONTRACEPTION",
        #     "TEST WEALTH QUINTILE",
        #     "TEST NUMBER OF VISITS",
        #     "TEST UNIT OF MEASURE",
        #     "TEST FREQUENCY",
        #     2001,
        #     999.9,
        #     "TEST UNITS",
        #     "TEST RESPONSIBLE AGENCY",
        #     "TEST DATA SOURCE"
        # ]] + data_en[1:]
        #
        # This will add a new row at the end of the CSV.

        resource = write_csv(
            data_en,
            csv_filename
        )

        new_hash = get_new_hash(data_en + [dataflow_description])
        existing_hash, resource_id = get_existing_hash(dataflow_id)
        update_required = False
        update_hash_required = False
        was_deleted = False
        deleted_dataset = None

        if resource_id:
            try:
                toolkit.get_action('resource_show')(
                    {},
                    {
                        'id': resource_id
                    }
                )
            except Exception:
                was_deleted = True

                print('  + This resource was previously deleted.'
                      ' It will be uploaded again...\n'
                )

        try:
            deleted_dataset = toolkit.get_action('package_show')(
                {},
                {
                    'id': dataflow_name_munged
                }
            )

        except Exception:
            pass

        if deleted_dataset is not None \
           and deleted_dataset.get('state') == 'deleted':
            was_deleted = True
            toolkit.get_action('dataset_purge')(
                {},
                {
                    'id': dataflow_name_munged
                }
            )

            print('  + This dataset was previously deleted.'
                  ' It will be uploaded again...\n'
            )

        if existing_hash is not None and not was_deleted:
            update_required = compare_hashes(existing_hash, new_hash)

        if existing_hash and update_required \
           and resource_id and not was_deleted:
            patch_resource(
                dataflow_name_munged,
                dataflow_title,
                resource,
                resource_id
            )
            patch_dataset(
                dataflow_name_munged,
                owner_org,
                dataflow_title,
                dataflow_description_updated
            )
            update_hash_required = True

        elif existing_hash is None or was_deleted:
            create_dataset(
                dataflow_name_munged,
                owner_org,
                dataflow_title,
                dataflow_description_updated
            )
            resource_dict = upload_resource(
                dataflow_name_munged,
                dataflow_title,
                resource
            )
            resource_id = resource_dict.get('id')
            update_hash_required = True

        else:
            print('  + Data for {} is already up-to-date.\n'.format(
                dataflow_title
            ))

        if update_hash_required:
            update_hash(
                dataflow_id,
                dataflow_name_munged,
                resource_id,
                new_hash,
                dataflow_last_updated,
                existing_hash,
                was_deleted
            )

        print(
            '\n> SUCCESSFULLY EXTRACTED AND PROCESSED: {}\n\n'
            '  =======================================\n'.format(
                dataflow_title
            )
        )

        i += 1

    print('> DONE. {} DATAFLOWS EXTRACTED AND PROCESSED.\n'.format(i))
