.PHONY: assets docker readme start shell test


list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'


assets:
	npx gulp less &&\
        npm run webpack

readme:
	npx doctoc README.md

test:
	npx nightwatch
