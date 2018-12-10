.PHONY: assets docker readme start shell test


list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'


assets:
	npx gulp less

docker:
	docker pull openknowledge/ckan-base:2.7 && \
	docker pull openknowledge/ckan-dev:2.7 && \
	docker-compose -f docker/docker-compose.dev.yml build

i18n:
	# docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -c 'cd /srv/app/src_extensions/ckanext-querytool && python setup.py extract_messages'
	docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -c 'cd /srv/app/src_extensions/ckanext-querytool && python setup.py compile_catalog -l es -f' && \
	docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -c 'cd /srv/app/src_extensions/ckanext-querytool && python setup.py compile_catalog -l fr -f' && \
	docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -c 'cd /srv/app/src_extensions/ckanext-querytool && python setup.py compile_catalog -l pt_BR -f' && \
	docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -c 'cd /srv/app/src_extensions/ckanext-querytool && python setup.py compile_catalog -l zh_CN -f'

readme:
	npx doctoc README.md

start:
	docker-compose -f docker/docker-compose.dev.yml up

shell:
	docker exec -it docker_ckan-dev_1 bash

test:
	npx nightwatch
