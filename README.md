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
    - [Language selector](#language-selector)
  - [Updating readme](#updating-readme)
  - [Testings layouts](#testings-layouts)
  - [Config Settings](#config-settings)
    - [Optional Map Config Settings](#optional-map-config-settings)
    - [Optional Cookie Control Config Settings](#optional-cookie-control-config-settings)
  - [Modify CSS](#modify-css)
- [Custom Development Within the ckanext-querytool Extension](#custom-development-within-the-ckanext-querytool-extension)
  - [Frontend](#frontend)
    - [Plotly](#plotly)
    - [DataTables](#datatables)
    - [Leaflet](#leaflet)
    - [General](#general)
    - [UI Options for Charts and Tables](#ui-options-for-charts-and-tables)
    - [HTML/Jinja2 Templates](#htmljinja2-templates)
  - [Backend](#backend)
    - [API/Actions](#apiactions)
    - [Helpers](#helpers)
- [Google Analytics (GA4)](#google-analytics-ga4)

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
**NOTE:** Make sure to reference `/dist/` files, not the source files!

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

#### Language selector

For the country flags to appear in the language selector it's needed to make sure there's an associated flag for each one of the configured languages. This must be done by further expanding the `/ckanext-querytool/ckanext/querytool/public/base/resources/lang-flags.json` file. Here's an example of how this file looks like:
```
{
    "en": "gb",
    "pt_BR": "br",
    "es": "es",
    "fr": "fr",
    "km": "kh",
    "zh_CN": "cn"
}
```
The property name is always the language value. The value is always the ISO 3166-1-alpha-2 code of the country.

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

The extension supports some optional configurations:

- OpenStreetMaps
- Cookie Control

#### Optional Map Config Settings

The example values below are the defaults. To override them, add the following to your `.ini` or `.env` file and change the values as needed:

```
ckanext.querytool.map_osm_url = https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png
ckanext.querytool.map_osm_attribute = &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>
```

For example, if you want to use a dark CartoDB basemap instead of the default light map, you can set the variables to the following:

```
ckanext.querytool.map_osm_url = https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}{r}.png
```

The second variable is used for the attribution/copyright text. For example, if you decide to use OpenStreetMap without CartoDB, you can set the variables to the following:

```
ckanext.querytool.map_osm_url = https://tile.openstreetmap.org/{z}/{x}/{y}.png
ckanext.querytool.map_osm_attribute = &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>
```

**NOTE:** Changing the map provider, though possible, is not recommended. If the alternative isn't a complete and identical drop-in replacement, the map will most likely **not** work as expected, and you will need to make changes to the code to accommodate the new map provider.

#### Optional Cookie Control Config Settings

The [Cookie Control](https://www.civicuk.com/cookie-control/) panel can be configured using the following options:

```
ckanext.querytool.cc.enabled = True
ckanext.querytool.cc.api_key = your_api_key
ckanext.querytool.cc.license_type = COMMUNITY
ckanext.querytool.cc.popup_position = LEFT # Or RIGHT
ckanext.querytool.cc.theme_color = DARK    # Or LIGHT
ckanext.querytool.cc.initial_state = OPEN  # Or CLOSED
```

By default, if `enabled` is true, only `api_key` is required for the Cookie Control to work. Currently, it considers `auth_tkt` as a core cookie and Google Analytics Cookies as optionals. An API key can be generated by [registering here](https://www.civicuk.com/cookie-control/).

### Modify CSS

This extension uses LESS for styles. All changes must be made in one of the LESS
files located in the `ckanext-querytool/ckanext/querytool/fanstatic/less` folder.

Gulp.js is used for building CSS assets.

In order to build all CSS assets **run `node_modules/gulp/bin/gulp.js` once**. Gulp.js is watching for changes in the source LESS assets and will rebuild CSS on each change. If you have gulp.js installed globally on the system, you can just type `gulp` to run it.

## Custom Development Within the ckanext-querytool Extension

This extension diverges from CKAN core in a number of ways. The following sections cover the major areas of divergence and areas most commonly customized, along with high-level descriptions and links to the relevant code and external documentation.

The frontend libraries and frameworks used by this extension for charts and tables are:

- [Plotly](https://plotly.com/javascript/) for charts (bar, line, pie, etc.)
- [DataTables](https://datatables.net/) for tables
- [Leaflet](https://leafletjs.com/) for maps

These are used on top of:

- [jQuery](https://jquery.com/)
- [Bootstrap](https://getbootstrap.com/)
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

If any changes are made to the JavaScript files, you must be rebuild using [webpack](https://webpack.js.org/) (see the [Updating source files](#updating-source-files) section above).

For more information on CKAN core architecture as a whole, see [CKAN code architecture](https://docs.ckan.org/en/2.7/contributing/architecture.html?highlight=helpers). For anything not covered here, see the [CKAN 2.7 core documentation](https://docs.ckan.org/en/2.7/).

### Frontend

#### Plotly

This extension uses [plotly.js](https://plotly.com/javascript/) for charts (bar, line, pie, etc.). It's a JavaScript library for creating interactive charts and graphs, built on top of [d3.js](https://d3js.org/) and [stack.gl](https://github.com/stackgl).

Most changes and customizations of plotly.js are done in the `ckanext-querytool/ckanext/querytool/fanstatic/javascript/modules/viz-preview.js` file.

The main settings object can be found on [line 1977 of the `viz-preview.js` file](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/modules/viz-preview.js#L1977), and it's called `base_info`. It contains the following properties:
```
var base_info = {
  margin: {
    l: 20,
    r: 20,
    b: 20,
    t: 30,
    pad: 5,
  },
  title: titleVal,
  showlegend: show_legend, //show legend value
  legend: {
    xanchor: "left",
    x: -0.02,
    y: -0.27,
    orientation: "h",
    title: {
      text: legend_title_text,
      side: "top",
      //  Reference: https://plotly.com/javascript/reference/layout/#layout-legend
      font: {
        size: 15
      }
    }
  },
  xaxis: {
    tickformat: x_tick_format,
    automargin: true,
    title: "",
    tickangle: this.options.x_text_rotate,
    tickmode: "auto",
    nticks: this.options.x_tick_culling_max,
    tickfont: {
      size: 14,
    },
    categoryorder: "array",
    categoryarray: sortedArr
  },
  yaxis: {
    tickformat: y_tick_format,
    automargin: true,
    hoverformat: format,
    tickangle: this.options.y_text_rotate,
    tickfont: {
      size: 14,
    },
  },
  hovermode: "closest",
};
```

Any of these properties can be modified to change the default behavior of the chart. For example, if you want to change the default font size of the chart, you can change the `size` property of the `tickfont` object. Additionally, each chart type has its own set of properties that can be modified by looking for the respective `trace` object. For example, each line chart type has the following properties in their [`trace` objects](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/modules/viz-preview.js#L819):
```
var trace = {
  x: x,
  y: columns[tmp].slice(1),
  type: "scatter",
  mode: labelsMode,
  text: convertedTextTitles,
  textposition: "top right",
  textfont: {
    size: 14,
  },
  name: name,
  line: {
    width: setDefaultWidth(lineWidthsList[tmp]),
    dash: lineTypesList[tmp],
  },
  hovertemplate: "%{y}<extra></extra>",
  error_y: {},
  error_x: {},
};
```

**NOTE:** Though all of the properties are customizable, it's recommended to only change them if they're absolutely necessary, as any changes can have unintended consequences.

For more information on how to customize plotly.js, see the [plotly.js documentation](https://plotly.com/javascript/).

#### DataTables

This extension uses [DataTables](https://datatables.net/) for table charts/visualizations. DataTables is a JavaScript library for creating interactive tables, built on top of [jQuery](https://jquery.com/).

Changes and customizations of DataTables can generally be handled in `ckanext-querytool/ckanext/querytool/fanstatic/javascript/vitals.js` or `ckanext-querytool/ckanext/querytool/fanstatic/javascript/modules/table-module.js`.

An example of custom changes can be found at the very top of [`vitals.js`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/vitals.js#L1-L273), where a feature plugin (`RowsGroup`) is used to automatically merge columns cells based on their values eqaulity.

For more information on how to customize DataTables, see the [DataTables documentation](https://datatables.net/manual/).

#### Leaflet

This extension uses [Leaflet](https://leafletjs.com/) for map charts/visualizations. Leaflet is a JavaScript library for creating interactive maps, built on top of [OpenStreetMap](https://www.openstreetmap.org/).

Changes and customizations of Leaflet can generally be handled in `ckanext-querytool/ckanext/querytool/fanstatic/javascript/modules/map-module.js`.

#### General

Most general jQuery and JavaScript customizations/overrides can be handled in `ckanext-querytool/ckanext/querytool/fanstatic/javascript/vitals.js`. Here's a small example where we watch for changes in the filter dropdowns and trigger a click on the "Update" button when a change is detected (code can be found [here](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/vitals.js#L1304-L1306)):
```
$("body").on('change','.has-filter .filter-item-value', function() {
  $('.btn-update').trigger("click");
})
```

For more information on how to customize jQuery and JavaScript, see the [jQuery documentation](https://api.jquery.com/) and [JavaScript documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

#### UI Options for Charts and Tables

For most changes to the options found in the UI (for charts and tables, e.g. https://YOUR_SITE/report/edit_visualizations/REPORT_NAME), you can find the relevant code in the following files:

- [viz-preview.js](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/modules/viz-preview.js)
- [visualizations_settings.js](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/fanstatic/javascript/ckanext/querytool/fanstatic/javascript/visualizations_settings.js)

#### HTML/Jinja2 Templates

CKAN (and this extension) use [Jinja2](https://jinja.palletsprojects.com/en/3.1.x/) for templating. The templates for this extension can be found in [`ckanext-querytool/ckanext/querytool/templates`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/templates). Any changes in these HTML files should be reflected immediately in the UI immediately, but if you're not seeing them, you may need to restart CKAN. 

Additionally, if you need to override a template found in CKAN core, you can simply copy the file found in CKAN core into the `ckanext-querytool/ckanext/querytool/templates` directory and make your changes there. You must make sure that it's placed in the same directory structure as the original file, e.g. if you want to override the `package/read.html` template, you would copy the file from `ckan/templates/package/read.html` to `ckanext-querytool/ckanext/querytool/templates/package/read.html`.

For more information on how to customize Jinja2 templates, see the [Jinja2 documentation](https://jinja.palletsprojects.com/en/3.1.x/), [CKAN Jinja2 documentation](https://docs.ckan.org/en/2.7/theming/templates.html#jinja2), and [CKAN theming documentation](https://docs.ckan.org/en/2.7/theming/templates.html#replacing-a-default-template-file).

### Backend

#### API/Actions

The process for creating/customizing the API endpoints (Actions) is the slightly different than the [CKAN documentation](https://docs.ckan.org/en/2.7/extensions/index.html), but this is only because we have automated `get_actions` in `plugin.py` to return all actions found in [`ckanext-querytool/ckanext/querytool/logic/action`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/logic/action) (in this directory, we have 4 files: `create.py`, `delete.py`, `get.py`, and `update.py`, all of which are included in the automated loading), so they don't need to be added individually. We do this with the following code (found in [`plugin.py`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/plugin.py):
```
module_root = 'ckanext.querytool.logic.action'
action_functions = h._get_functions(module_root)
```

As a basic example, let's say we want to create a new GET endpoint that simply returns the text "This is our new API endpoint!".

1. We would simply add the following code to [`ckanext-querytool/ckanext/querytool/logic/action/get.py`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/logic/action/get.py):
    ```
    @toolkit.side_effect_free
    def our_new_action(context, data_dict):
        return 'This is our new API endpoint!'
    ```
2. Restart CKAN
3. Visit https://YOUR_SITE/api/3/action/our_new_action, and you should see the following response:
    ```
    {
      "help": "https://YOUR_SITE/api/3/action/help_show?name=our_new_action",
      "success": true,
      "result": "This is our new API endpoint!"
    }
    ```

#### Helpers

Helpers are re-usable functions. They're available in the backend Python code as well as in Jinja2 templates. There's basically no limit to what a helper can do. They can range from simple functions that return a string, to more complex functions that parse, filter/alter, and return data.

The process for creating/customizing helpers is the same as found in the [CKAN helper documentation](https://docs.ckan.org/en/2.7/theming/templates.html#adding-your-own-template-helper-functions).

As a basic example, let's say we want to create a new helper that simply returns the text "This is our new helper!".

1. We would start by adding the following code to [`ckanext-querytool/ckanext/querytool/helpers.py`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/helpers.py):
    ```
    def our_new_helper():
        return 'This is our new helper!'
    ```
2. Add our new helper to `get_helpers` in [`plugin.py`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/plugin.py):
    ```
    def get_helpers(self):
        return {
            ... OTHER HELPERS ...
            'our_new_helper': helpers.our_new_helper
        }
    ```
3. Call the new helper in another function or in a template. For example, in a template, we can call it with:
    ```
    {{ h.our_new_helper() }}
    ```
4. Restart CKAN

Now, you should see the text "This is our new helper!" in the template wherever you called it (or you can add a log in the backend function you called it from to see the output in the logs).

For a better idea of what helpers can be used for, you can take a look at the helpers in [`ckanext-querytool/ckanext/querytool/helpers.py`](https://github.com/datopian/ckanext-querytool/blob/master/ckanext/querytool/helpers.py) and [CKAN core helpers](https://github.com/ckan/ckan/blob/ckan-2.7.12/ckan/lib/helpers.py).

## Google Analytics (GA4)

To setup Google Analytics using GA4, you need to install a specific branch (`ed-dev-ga4`) of the Datopian Google Analytics extension:

[`ckanext-googleanalytics` with GA4 support](https://github.com/datopian/ckanext-googleanalytics/tree/ed-dev-ga4)

Then follow the instructions in the ["Setup" section of the README](https://github.com/datopian/ckanext-googleanalytics/tree/ed-dev-ga4#setup).
