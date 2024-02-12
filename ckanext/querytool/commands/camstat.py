# -*- coding: utf-8 -*-

'''
USAGE: paster --plugin=ckanext-querytool update_camstat --config=/path/to/production.ini

`paster` is a command provided by [The Pylons Project](https://docs.pylonsproject.org/en/latest/), 
a collection of tools and utilities for Python and used extensively in CKAN. It allows you to run 
scripts in various locations, all through a unified utility.

For example, CKAN and any extension installed along with it can have scripts for miscellaneous 
purpose. `paster` makes it easy to run any of these scripts. You only need to provide the plugin 
name (`ckan` for CKAN core scripts or `ckanext-EXTENSION_NAME` for extensions), the command, and 
the path to your `.ini` CKAN config file.

**Note**: On first run, the script will create the organization (if it doesn't exist) and datasets, 
as well as upload all data into resources. Every time you run the script after that, it will first 
check if there are changes to the data. If nothing changes, the script won't do anything. If any of 
the source data has changed, only those datasets will be updated.
'''

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
import pandas as pd

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
MAP_SORTING = {
    'Cambodia': 0,
    'Banteay Meanchey': 1,
    'Battambang': 2,
    'Kampong Cham': 3,
    'Kampong Chhnang': 4,
    'Kampong Speu': 5,
    'Kampong Thom': 6,
    'Kampot': 7,
    'Kandal': 8,
    'Koh Kong': 9,
    'Kratie': 10,
    'Mondul Kiri': 11,
    'Phnom Penh': 12,
    'Preah Vihear': 13,
    'Prey Veng': 14,
    'Pursat': 15,
    'Ratanak Kiri': 16,
    'Siem Reap': 17,
    'Preah Sihanouk': 18,
    'Stung Treng': 19,
    'Svay Rieng': 20,
    'Takeo': 21,
    'Otdar Meanchey': 22,
    'Kep': 23,
    'Pailin': 24,
    'Tboung Khmum': 25,
    'Battambang and Pailin': 31,
    'Kampot, Preah Sihanouk and Kep': 32,
    'Kratie, Preah Vihear and Stung Treng': 33,
    'Mondul Kiri and Ratanak Kiri': 34,
    'Otdar Meanchey and Siem Reap': 35,
    'Kampot and Kep': 36,
    'Koh Kong and Preah Sihanouk': 37,
    'Preah Vihear and Stung Treng': 38
}


class UpdateCamstat(CkanCommand):
    '''
    Retrieves data from the Camstat website topic "Health and Nutrition",
    cleans it, and creates datasets and resources in CKAN if they don't exist.
    If they do exist, it compares the new checksum with a stored checksum and
    updates them if there are changes.

    This class contains the main command (`command`) and table setup (`setup_tables`) functions.
    '''

    summary = __doc__.split('\n')[0]
    usage = __doc__
    max_args = 0
    min_args = 0

    def command(self):
        '''
        Adds the command to the CKAN `paster` ecosystem.

        This is how CKAN knows what to do when you use:

            paster --plugin=ckanext-querytool update_camstat --config=/path/to/production.ini


        `command` does 2 things:
          - If a hash table doesn't exist, create it. Hashes are generated and 
            stored to know if a data needs to be updated due to changes.
          - Calls `update_camstat` (which calls all other functions as needed).
        '''
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
        '''
        When called, this function creates a table in the DB, `camstat_hashes`, 
        to store distinct hashes of the data.

        When the script is run again later:
          - New hashes are generated and compared to the old hashes before updating 
            each dataset.
          - If the hash has changed for a given dataset, that dataset is updated with 
            the latest data and the new hash is saved to the DB.
        '''
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


'''
The following functions are only used for testing/debugging. They will run when the command is used 
_only when uncommented_ in the `command` function:

```
# The following functions can be
# used for testing and debugging
#
# purge_datasets(self.owner_org)
# purge_organization(self.owner_org)
# drop_table()
```

- `purge_datasets` - Deletes all current Camstat datasets
- `drop_table` - Removes the hash table from the DB
- `purge_organization` - Deletes the Camstat Organization from CKAN

Start of testing/debugging functions.
'''


def purge_datasets(owner_org):
    print(
        '> PURGING ALL DATASETS FOR ORGANIZATION: {}\n'
        .format(owner_org)
    )

    datasets = toolkit.get_action('package_search')({}, {'rows': 1000})
    i = 0

    for dataset in datasets['results']:
        if dataset.get('organization', {}).get('name') == owner_org:
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


'''
End of testing/debugging functions.
'''


def utf_8_encoder(unicode_csv_data):
    '''
    A small helper function to fix any improperly encoded data. 
    Currently **deprecated**.
    '''
    for line in unicode_csv_data:
        yield line.encode('utf-8')


def clean_csv(data, id_removal, dataflow_agency,
              dataflow_id, dataflow_version):
    '''
    Cleans the data.

    It handles the following cases:
    - Reformats inconsistent values
    - Remove special keywords before the values (e.g. removes `SOME_VALUE: ` in `SOME_VALUE: Some Value`)
    - Removes `NA` values
    - Wraps strings containing `,` in quotes to avoid being treated as a new column 
      (e.g. adds quotes to values like "One, two, and three", otherwise, each item will be considered a new column)
    - Removes unused IDs
    - Converts all headers from fully uppercase to titles (e.g. `HEADER 1` -> `Header 1`)
    - Removes empty columns

    Once cleaning is done, the function calls `pivot_data` before returning the final data 
    (see the next section for more information regarding `pivot_data`).
    '''
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
                    if j == ref_area_index and id_removal[i][j] != 'REF_AREA':
                        data[i][j] = '{}.{}'.format(str(MAP_SORTING[data[i][j]]), data[i][j])
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

    # data = pivot_data(data)

    return data

# def pivot_data(data):
#     '''
#     Pivots the data from a wider and less usable format to a cleaner, vertical CSV, with one observation per row.
#     The main issue with the original format is that the column headers we need for visualizations are in a single
#     column themselves, instead of at the top as headers.
#     '''
#
#     print('  + Pivoting data...')
#
#     df = pd.DataFrame(data)
#     header_row = df.iloc[0]
#     df = df[1:]
#     df.columns = header_row
#
#     df_melted = df.melt(id_vars=['Dataflow', 'Indicator', 'Reference area', 'Sex',
#        'Age group', 'Unit of measure', 'Frequency', 'Time period', 'Observation value', 'Unit multiplier',
#        'Responsible agency', 'Data source', 'REF_AREA'], var_name='Category', value_name='Group')
#
#     columns = df_melted.columns.tolist()
#     columns = columns[:2] + columns[-2:] + columns[2:-2]
#     df_melted = df_melted[columns]
#
#     print('  + Done.\n')
#
#     return [df_melted.columns.values.tolist()] + df_melted.values.tolist()


def compare_hashes(existing_hash, new_hash):
    '''
    Compares a new dataset/resource hash with an existing hash (if one exists) and returns `True` or `False`.
    '''
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
    '''
    Uploads a new resource to a given dataset.
    '''
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
    '''
    Updates the data in a resource for a given dataset.
    '''
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
    '''
    Creates a new dataset for a given dataflow.
    '''
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
    '''
    Updates a dataset for a given dataflow.
    '''
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
    '''
    Checks if the Camstat organization exists. If not, it creates the organization, otherwise, it's skipped.
    '''
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
    '''
    Builds the dataset descriptions with the dataflow ID and current time. For example:
    >**Extracted from**: _DF_NUTRITION_
    >
    >**Last extracted**: _2022-09-28 07:56 PM (UTC)_
    '''
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
    '''
    Retrieves the raw data from the [Camstat data API](https://nsiws-stable-camstat-live.officialstatistics.org).
    '''
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
    '''
    Creates a temporary CSV file from the raw data. This is then cleaned, transformed, 
    and uploaded as a resource, as mentioned in the other steps.
    '''
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
    '''
    Retrieves the list dataflow IDs/names from the Health and Nutrition topic of the Camstat API. 
    This is used to retrieve the raw data for each dataflow.
    '''
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
    '''
    Generates a new data hash. This is compared to the existing data hash later.
    '''
    print('  + Generating new hash...')

    new_hash = hashlib.sha256(str(data).encode('utf-8')).hexdigest()

    print('  + New hash generated successfully: {}\n'.format(new_hash))

    return new_hash


def get_existing_hash(dataflow_id):
    '''
    Retrieves the existing data hash for a given resource (if exists already).
    '''
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
    '''
    Updates the data hash in the DB if there was a change. This function will also 
    remove a hash if the resource/dataset is deleted.
    '''
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
    '''
    This function contains the overall process code. It's where most of the previous 
    functions get called when needed.

    Here's the flow of the process:
    - Retrieves all dataflows using `get_dataflows`
    - Iterates over the dataflows:
        - Extracts the metadata from the dataflow 
          (title, ID, name, agency, description)
        - Retrieves the current time 
          (used for "Last extracted")
        - Calls `prepare_dataflow_description` 
          (this will be added to the dataset object later in the process)
        - Retrieves the raw data using `get_data`
        - Cleans the retrieved raw data using `clean_csv`
        - Write the temporary CSV using `write_csv`
        - Generate a new data hash using `get_new_hash`
        - Retrieve the existing data hash (if exists)
        - Check if the new data hash and existing data hash differ
            - If no existing data hash exists:
                - Create a new dataset and resource
            - If the data hashes match:
                - The data is up-to-date, move on to the next dataflow
            - If they differ:
                - Update the resource in the dataset with the latest data
    '''
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
