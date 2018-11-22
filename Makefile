.PHONY: assets docker readme start shell test


list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'


assets:
	npx gulp less

docker:
	docker pull openknowledge/ckan-base:2.7 && \
	docker pull openknowledge/ckan-dev:2.7 && \
	docker-compose -f docker/docker-compose.dev.yml build

readme:
	npx doctoc README.md

start:
	docker-compose -f docker/docker-compose.dev.yml up

shell:
	docker exec -it docker_ckan-dev_1 bash

test:
	npx nightwatch -e chrome
