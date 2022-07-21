from __future__ import print_function
import logging
import requests

from ckan.lib.cli import CkanCommand
from ckan.lib.search import rebuild
from ckan.plugins import toolkit
from csv import reader
import os
import datetime


log = logging.getLogger(__name__)


class UpdateCamstat(CkanCommand):
    """
    Retrieves datasets and topics from the Camstat website and creates
    their counterparts in CKAN (datasets = datasets, topics = groups).
    """

    summary = __doc__.split('\n')[0]
    usage = __doc__
    max_args = 0
    min_args = 0

    def command(self):
        self._load_config()
        self.dataset_name = None
        self.datasets_url = 'https://sdmx-faceted-search-camstat-live.officialstatistics.org/api/search'
        self.request_payload = {
            "lang": "en",
            "search": "",
            "facets": {
                "6nQpoAP":["0|Education#EDU#"],
                "datasourceId":["CamStat-stable"]
            },
            "rows":100,
            "start":0
        }

        self.datasets_page = requests.post(self.datasets_url, json=self.request_payload)
        self.datasets_dataflows = self.datasets_page.json()

        for dataflow in self.datasets_dataflows['dataflows']:
            self.dataflow_id = dataflow['dataflowId']
            self.dataflow_name = dataflow['name']
            self.dataflow_description = dataflow.get('description')
            self.dataflow_version = dataflow.get('version', '1.0')

            for key, value in dataflow.items():
                print('{} : {}'.format(key, value))

            self.id_url = 'https://nsiws-stable-camstat-live.officialstatistics.org/rest/data/KH_NIS,{},{}/all?dimensionAtObservation=AllDimensions'.format(self.dataflow_id, self.dataflow_version)
            self.id_headers = {'Accept': 'application/vnd.sdmx.data+csv;file=true;labels=id'}
            self.id_req = requests.get(self.id_url, headers=self.id_headers)
            self.id_removal = []

            for line in reader(self.id_req.text.splitlines(),
                               delimiter=',', quotechar='"'):
                self.id_removal.append(line)

            self.data_url = 'https://nsiws-stable-camstat-live.officialstatistics.org/rest/data/KH_NIS,{},{}/all?dimensionAtObservation=AllDimensions'.format(self.dataflow_id, self.dataflow_version)
            self.data_headers = {'Accept': 'application/vnd.sdmx.data+csv;file=true;labels=both'}
            self.data_req = requests.get(self.data_url, headers=self.data_headers)
            self.data = []

            for line in reader(self.data_req.text.splitlines(),
                               delimiter=',', quotechar='"'):
                self.data.append(line)

            for i in range(len(self.data)):
                if i <= len(self.id_removal):
                    for j in range(len(self.data[i])):
                        to_be_removed = self.id_removal[i][j] + ': '

                        if 'KH_NIS:{}'.format(self.dataflow_id) in self.data[i][j]:
                            self.data[i][j] = '{} ({})'.format(
                                self.dataflow_id,
                                self.dataflow_version
                            )

                        if to_be_removed in self.data[i][j]:
                            self.data[i][j] = self.data[i][j].replace(
                                to_be_removed, ''
                            )

                        if self.data[i][j] == 'NA':
                            self.data[i][j] = ''
                            continue

                        if ',' in self.data[i][j]:
                            self.data[i][j] = '"{}"'.format(self.data[i][j])


            self.current_path = os.path.dirname(__file__)
            self.csv_path = os.path.join(self.current_path, '{}.csv'.format(self.dataflow_id))

            with open(self.csv_path, 'w') as f:
                for line in self.data:
                    f.write(','.join(line) + '\n')

            self.owner_org = 'camstat'
            self.api_key = 'f151d186-2215-4b7d-be41-237c986e0c1e'
            self.dataflow_title = self.dataflow_name.title()
            self.dataflow_name_munged = (self.dataflow_name.replace(
                ' ',
                '-'
            )).lower()
            #  + '-' + self.dataflow_id.replace('_', '-')
            self.dataflow_last_extracted = datetime.datetime.utcnow().strftime(
                '%Y-%m-%d %I:%M %p (UTC)'
            )

            if self.dataflow_description:
                self.dataflow_description = \
                    '{}\n\n\n**Extracted from**: _{}_\n\n\n**Last extracted**: _{}_'.format(
                        self.dataflow_description, self.dataflow_id, self.dataflow_last_extracted
                    )
            else:
                self.dataflow_description = \
                    '**Extracted from**: _{}_\n\n\n**Last extracted**: {}'.format(
                    self.dataflow_id, self.dataflow_last_extracted
                )

            try:
                toolkit.get_action('package_show')({}, {'id': self.dataflow_name_munged})
                toolkit.get_action('dataset_purge')({}, {'id': self.dataflow_name_munged})
            except Exception as e:
                print(e)

            print('\nPackage doesn\'t exist. Creating it now...\n')

            toolkit.get_action('package_create')(
                {},
                {
                    'title': self.dataflow_title,
                    'owner_org': self.owner_org,
                    'name': self.dataflow_name_munged,
                    'notes': self.dataflow_description
                }
            )

            print('\nUploading resources...\n')

            try:
                print('Uploading CSV')
                requests.post(
                    "http://0.0.0.0:5000/api/action/resource_create",
                    data={'package_id': self.dataflow_name_munged, 'name': self.dataflow_title + ' CSV'},
                    headers={'X-CKAN-API-Key': self.api_key},
                    files=[("upload", file(self.csv_path))]
                )
            except Exception as e:
                log.info('Error uploading {}: {}'.format(e))
                print('\nError uploading {}: {}'.format(e))