.PHONY: build docs server static shell test upgrade


list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'

build:
	docker-compose -f docker/docker-compose.dev.yml build

docs:
	npx doctoc README.md

server:
	docker-compose -f docker/docker-compose.dev.yml up

static:
	npx gulp less

shell:
	docker-compose -f docker/docker-compose.dev.yml exec ckan-dev bash -it

test:
	npx nightwatch -e chrome

upgrade:
	docker pull openknowledge/ckan-base:2.8 && docker pull openknowledge/ckan-dev:2.8 &&
	docker-compose -f docker/docker-compose.dev.yml build ckan-dev
