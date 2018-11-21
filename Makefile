.PHONY: bash build server styles upgrade test toc


list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'

bash:
	docker exec -it dockerckaned_ckan-dev_1 bash

build:
	docker-compose -f docker/docker-compose.dev.yml build

server:
	docker-compose -f ../../docker-compose.dev.yml up

styles:
	npx gulp less

upgrade:
	docker pull openknowledge/ckan-base:2.8 && docker pull openknowledge/ckan-dev:2.8 &&
	docker-compose -f ../../docker-compose.dev.yml build ckan-dev

test:
	nightwatch -e chrome

toc:
	npx doctoc README.md
