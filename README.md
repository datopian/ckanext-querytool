# ckanext-querytool

[![Build Status](https://travis-ci.org/ViderumGlobal/ckanext-querytool.svg?branch=master)](https://travis-ci.org/ViderumGlobal/ckanext-querytool)

A CKAN extension to create visualizations based on the uploaded datasets.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Creating new releases](#creating-new-releases)
  - [Test data seed command](#test-data-seed-command)
- [Development](#development)
  - [Environment installation](#environment-installation)
  - [Running the development environment](#running-the-development-environment)
  - [Asset building requirements](#asset-building-requirements)
  - [Building static assets](#building-static-assets)
  - [Javascript and Webpack](#javascript-and-webpack)
    - [Webpack and Babel config](#webpack-and-babel-config)
    - [Javascript files](#javascript-files)
    - [Updating source files](#updating-source-files)
  - [Working with i18n](#working-with-i18n)
  - [Updating readme](#updating-readme)
  - [Testings layouts](#testings-layouts)
  - [Config Settings](#config-settings)
  - [Modify CSS](#modify-css)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Creating new releases

Before creating a new release, see the next section, [Test data seed command](#test-data-seed-command)

### Test data seed command

On a freshly installed portal, with nothing but an admin user, you can run a `paster` command to populate the portal with test data found on the [STEPS Data](https://vital-stepsdata.org/) site. This includes the STEPS Survey organization, 9 datasets with 2 resources each, and 9 reports with multiple visualizations.

Before creating a new release, this command should be run to verify that there are no compatibility issues. This could be especially critical if there are any changes to the DB tables or structure.

To populate the portal, run:

```
paster --plugin=ckanext-querytool seed_portal -c /path/to/.ini
```

It will then prompt the user to enter the admin name and admin API key:

```
Enter the admin login name: <ADMIN_NAME>

Enter the admin API key: <API_KEY>
```

That's it! You'll see output for each step (but the overall run time is very fast) and it will alert you if it runs into any issues.

If you have issues running the command successfully, you might need to run these `paster` commands:

>**WARNING**: The following commands will completely clear the DB, including the admin user, password, and email address. If you've created anything on the portal, you'll need to do so again.

```
paster --plugin=ckan db clean -c /path/to/.ini
paster --plugin=ckan db init -c /path/to/.ini
```

After you've recreated the admin user, run the `seed_portal` command again, with this admin user name and _new_ API key.

**TODO**: _Possibly_ add a `make` command to the [ckan-cloud-docker](https://github.com/datopian/ckan-cloud-docker) `Makefile`.

## Development

### Environment installation

**NOTE:** There's not a current full Docker environment for this project. The following steps are for setting up a source install of CKAN, but using a Docker image for Solr (See point 2 for using the Docker image for Solr) instead of a local install.

1. Install CKAN 2.7.3 from source by following the steps found in the [CKAN install documentation](https://docs.ckan.org/en/2.7/maintaining/installing/install-from-source.html) (Before proceeding, read through the following points).
    - Make sure to install the tag `ckan-2.7.3`. So, replace `pip install -e 'git+https://github.com/ckan/ckan.git@ckan-2.7.12#egg=ckan'` from [part c. in the docs](https://docs.ckan.org/en/2.7/maintaining/installing/install-from-source.html#install-ckan-into-a-python-virtual-environment) with `pip install -e 'git+https://github.com/ckan/ckan.git@ckan-2.7.3#egg=ckan'`.
    - Apply this patch to CKAN (fixes errors with datastore):
        ```
        diff --git a/ckanext/datastore/helpers.py b/ckanext/datastore/helpers.py
        index b616f0f94..b58cb1a76 100644
        --- a/ckanext/datastore/helpers.py
        +++ b/ckanext/datastore/helpers.py
        @@ -105,7 +105,12 @@ def get_table_names_from_sql(context, sql):
             table_names = []
         
             try:
        -        query_plan = json.loads(result['QUERY PLAN'])
        +        if isinstance(result['QUERY PLAN'], list):
        +            result_query_plan = json.dumps(result['QUERY PLAN'])
        +            query_plan = json.loads(result_query_plan)
        +        else:
        +            query_plan = json.loads(result['QUERY PLAN'])
        +
                 plan = query_plan[0]['Plan']
         
                 table_names.extend(_get_table_names_from_plan(plan))
        
        ```
    - Update `psycopg2` in the CKAN `requirements.txt` file to this version before installing:
        ```
        psycopg2==2.7.3.2
        ```
    - For the best compatibility, install PostgreSQL 12 if possible.
2. Clone and use [this Solr docker-compose setup](https://github.com/datopian/docker-ckan-solr) instead of a local Solr install (you can clone this in the same parent directory where you cloned CKAN. Using this option for Solr requires installing `docker` and `docker-compose` on your OS).
    - Update `solr_url` in your `.ini` file (from step 1) if it differs from this:
        ```
        solr_url = http://127.0.0.1:8986/solr/ckan
        ```
3. Clone and install DataPusher following the steps found in the [documentation](https://github.com/ckan/datapusher) (you can clone this in the same parent directory where you cloned CKAN and Solr, but install it in **a new virtual environment** to avoid potential `SQLAlchemy` version conflicts with CKAN):
    - Update `ckan.datapusher.url` in your `.ini` file (from step 1) if it differs from this:
        ```
        ckan.datapusher.url = http://127.0.0.1:8800/
        ```
    - Add `datastore` and `datapusher` to `ckan.plugins` in your `.ini` or `.env` file (in case you missed this step in the CKAN and DataPusher docs):
        ```
        ckan.plugins = querytool datastore datapusher EXTENSION_4 ...
        ```
4. Clone and install **this repo** (`ckanext-querytool`) (in the `src` directory of the same parent directory as CKAN and Solr, using the same Python virtual environment from step 1):
    ```
    # Installation (inside the CKAN virtual environment)
    cd ckanext-querytool
    python setup.py develop
    pip install -r requirements.txt
    ```
    - Add `querytool` to your `plugins` in your `.ini` or `.env` file.
        ```
        ckan.plugins = querytool EXTENSION_2 EXTENSION_3 ...
        ```

### Running the development environment

Once you've followed the above steps and everything is installed and ready, you can start the environment. This requires running a few commands, each in their own terminal.

1. Start Solr:
    ```
    # Running Solr (from the parent directory)
    docker-compose -f docker-ckan-solr/docker-compose.yml up
    ```
2. Start DataPusher:
    ```
    # Running DataPusher (from the parent directory, inside the CKAN virtual environment)
    python datapusher/datapusher/main.py datapusher/deployment/datapusher_settings.py
    ```
3. Start CKAN (depending on how/where you set CKAN up, you might not need to use `sudo`):
    ```
    # Running CKAN (from the parent directory, inside the CKAN virtual environment)
    sudo paster --plugin=ckan serve /PATH/TO/YOUR/INI_FILE
    ```

### Asset building requirements

For building static assets, Node.js is required and can be installed with these commands:

```bash
$ nvm install 10
$ nvm use 10
$ npm install
```

### Building static assets

Put your scripts/fonts/etc inside the `ckanext/querytool/fanstatic` folder and images inside the `ckanext/querytool/public` folder. It can be used as usual ckan `fanstatic` and `public` contents. At the same time, we use CSS preprocessor (LESS) to build our styles. Put your styles inside the `ckanext/querytool/fanstatic/less` and build it:

```bash
$ make assets
```

Processed styles will be put to the `ckanext/querytool/fanstatic/css` folder.

### Javascript and Webpack

#### Webpack and Babel config

`.babelrc` -- babel config (see https://babeljs.io/docs/en/configuration#babelrc for config options)
`webpack.config.js` -- webpack config (see https://webpack.js.org/configuration/)

#### Javascript files

Source files for the querytool live in:
`ckanext/querytool/fanstatic/javascript`

Distribution files (files served via our extension) are compiled via webpack and live in:
`ckanext/querytool/fanstatic/javascript/dist`
*NOTE*: Make sure to reference `/dist/` files, not the source files!

Vendor files (third party libraries) live in:
`ckanext/querytool/fanstatic/javascript`

#### Updating source files

Source files can be changed as needed. After updating run:
`npm install && npm run webpack` which will build the transpiled / minified resources and copy them to the `/dist` folder in the host machine.

### Working with i18n

To extract i18n messages and compile the catalog we have to have our development server running. In another terminal window run a command:

```
$ make i18n
```

See CKAN documentation for more on i18n management.

### Updating readme

To update this readme's table of contents run:

```bash
$ make readme
```

### Testings layouts

The app allows to configure different layouts for an application's visualizations. We can test expected behavious in half-automated way using Chrome console in the brower:

- Go to /querytool/public/detailed-mortality-by-cause
- Copy-past and start in the console script from `bin/test-layouts.js`

### Config Settings

These are the required configuration options used by the extension:

1. Add config for map item base layer:
```
ckanext.querytool.map_osm_url = https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png

ckanext.querytool.map_osm_attribute = &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>
```

2. Add config for the base public breadcrumb name:
```
ckanext.querytool.public_breadcrumb_name = Health Topics
```

3. Add config for visibility of navigation bar in the public query tools:
```
ckanext.querytool.allow_nav_bar = False
```
**NOTE:** The navigation bar config option is still present, but we are not using it.

### Modify CSS

This extension uses LESS for styles. All changes must be made in one of the LESS
files located in the `ckanext-querytool/ckanext/querytool/fanstatic/less` folder.

Gulp.js is used for building CSS assets.

In order to build all CSS assets **run `node_modules/gulp/bin/gulp.js` once**. Gulp.js is watching for changes in the source LESS assets and will rebuild CSS on each change. If you have gulp.js installed globally on the system, you can just type `gulp` to run it.
