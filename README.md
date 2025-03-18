# ckanext-querytool

A CKAN extension to create Plotly, DataTable, and Leaflet visualizations using dataset resources.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

**Table of Contents**  *generated with [DocToc](https://github.com/ktechhub/doctoc)*

<!---toc start-->

* [ckanext-querytool](#ckanext-querytool)
  * [Creating new releases](#creating-new-releases)
    * [Test data seed command](#test-data-seed-command)
  * [Development Environment installation](#development-environment-installation)
  * [Custom Development Within the ckanext-querytool Extension](#custom-development-within-the-ckanext-querytool-extension)
    * [Frontend](#frontend)
      * [Plotly](#plotly)
      * [DataTables](#datatables)
      * [Leaflet](#leaflet)
      * [General](#general)
      * [UI Options for Charts and Tables](#ui-options-for-charts-and-tables)
      * [HTML/Jinja2 Templates](#htmljinja2-templates)
      * [Language selector](#language-selector)
    * [Backend](#backend)
      * [API/Actions](#apiactions)
      * [Helpers](#helpers)
      * [Visualizations Object](#visualizations-object)
  * [Updating README](#updating-readme)
  * [Config Settings](#config-settings)
    * [Optional Map Config Settings](#optional-map-config-settings)
    * [Optional Cookie Control Config Settings](#optional-cookie-control-config-settings)
    * [Optional reCAPTCHA v2 on login page](#optional-recaptcha-v2-on-login-page)
* [Example values](#example-values)
  * [Google Analytics (GA4)](#google-analytics-ga4)

<!---toc end-->

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Creating new releases

Before creating a new release, see the next section, [Test data seed command](#test-data-seed-command)

### Test data seed command

On a freshly installed portal, with nothing but an admin user, you can run a command to populate the portal with test data found on the [STEPS Data](https://vital-stepsdata.org/) site. This includes the STEPS Survey organization, 9 datasets with 2 resources each, and 9 reports with multiple visualizations.

Before creating a new release, this command should be run to verify that there are no compatibility issues. This could be especially critical if there are any changes to the DB tables or structure.

To populate the portal, run:

```bash
% ckan -c <PATH_TO_INI> vs seed
```

It will then prompt the user to enter the admin name and admin API key:

```
Enter the admin login name: <ADMIN_NAME>

Enter the admin API key: <API_KEY>
```

That's it! You'll see output for each step (but the overall run time is very fast) and it will alert you if it runs into any issues.

If you have issues running the command successfully, you might need to clean and re-init the DB:

>**WARNING**: The following commands will completely clear the DB, including the admin user, password, and email address. If you've created anything on the portal, you'll need to do so again.

```bash
% ckan -c <PATH_TO_INI> db clean
% ckan -c <PATH_TO_INI> db init
```

After you've recreated the admin user, run the seed command again, with the new user name and API key.

## Development Environment installation

See the [Docker Compose setup for Vital Strategies CKAN](https://github.com/datopian/ckan-docker-vs-dev).

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

To rebuild the JavaScript files, use [webpack](https://webpack.js.org/) (if you need to install it, you can do so with `npm install -g webpack`—currently, Node v10-v16 are known to work—**TODO**: update compatibility for newer a Node version):

```bash
npm run webpack
```

For more information on CKAN core architecture as a whole, see [CKAN code architecture](https://docs.ckan.org/en/2.7/contributing/architecture.html?highlight=helpers). For anything not covered here, see the [CKAN 2.10 core documentation](https://docs.ckan.org/en/2.10/).

### Frontend

#### Plotly

This extension uses [plotly.js](https://plotly.com/javascript/) for charts (bar, line, pie, etc.). It's a JavaScript library for creating interactive charts and graphs, built on top of [d3.js](https://d3js.org/) and [stack.gl](https://github.com/stackgl).

Most changes and customizations of plotly.js are done in the `ckanext-querytool/ckanext/querytool/assets/javascript/modules/viz-preview.js` file.

The main settings object can be found in the [`viz-preview.js` file](ckanext/querytool/assets/javascript/modules/viz-preview.js), and it's called `base_info`. It contains the following properties:
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

Any of these properties can be modified to change the default behavior of the chart. For example, if you want to change the default font size of the chart, you can change the `size` property of the `tickfont` object. Additionally, each chart type has its own set of properties that can be modified by looking for the respective `trace` object. For example, each line chart type has the following properties in their `trace` objects:
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

**NOTE:** Though all of the properties are customizable, it's recommended to only change them if absolutely necessary, as any changes can have unintended consequences.

For more information on how to customize plotly.js, see the [plotly.js documentation](https://plotly.com/javascript/).

#### DataTables

This extension uses [DataTables](https://datatables.net/) for table charts/visualizations. DataTables is a JavaScript library for creating interactive tables, built on top of [jQuery](https://jquery.com/).

Changes and customizations of DataTables can generally be handled in `ckanext-querytool/ckanext/querytool/assets/javascript/vitals.js` or `ckanext-querytool/ckanext/querytool/assets/javascript/modules/table-module.js`.

An example of custom changes can be found at the very top of [`vitals.js`](ckanext/querytool/assets/javascript/vitals.js), where a feature plugin (`RowsGroup`) is used to automatically merge columns cells based on their values eqaulity.

For more information on how to customize DataTables, see the [DataTables documentation](https://datatables.net/manual/).

#### Leaflet

This extension uses [Leaflet](https://leafletjs.com/) for map charts/visualizations. Leaflet is a JavaScript library for creating interactive maps, built on top of [OpenStreetMap](https://www.openstreetmap.org/).

Changes and customizations of Leaflet can generally be handled in `ckanext-querytool/ckanext/querytool/assets/javascript/modules/map-module.js`.

#### General

Most general jQuery and JavaScript customizations/overrides can be handled in `ckanext-querytool/ckanext/querytool/assets/javascript/vitals.js`. Here's a small example where we watch for changes in the filter dropdowns and trigger a click on the "Update" button when a change is detected:
```
%("body").on('change','.has-filter .filter-item-value', function() {
  %('.btn-update').trigger("click");
})
```

For more information on how to customize jQuery and JavaScript, see the [jQuery documentation](https://api.jquery.com/) and [JavaScript documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

#### UI Options for Charts and Tables

For most changes to the options found in the UI (for charts and tables, e.g. https://YOUR_SITE/report/edit_visualizations/REPORT_NAME), you can find the relevant code in the following files:

- [viz-preview.js](ckanext/querytool/assets/javascript/modules/viz-preview.js)
- [visualizations_settings.js](ckanext/querytool/assets/javascript/visualizations_settings.js)

#### HTML/Jinja2 Templates

CKAN (and this extension) uses [Jinja2](https://jinja.palletsprojects.com/en/3.1.x/) for templating. The templates for this extension can be found in [`ckanext-querytool/ckanext/querytool/templates`](ckanext/querytool/templates). Any changes in these HTML files should be reflected immediately in the UI immediately, but if you're not seeing them, you may need to restart CKAN. 

Additionally, if you need to override a template found in CKAN core, you can simply copy the file found in CKAN core into the `ckanext-querytool/ckanext/querytool/templates` directory and make your changes there. You must make sure that it's placed in the same directory structure as the original file, e.g. if you want to override the `package/read.html` template, you would copy the file from `ckan/templates/package/read.html` to `ckanext-querytool/ckanext/querytool/templates/package/read.html`.

For more information on how to customize Jinja2 templates, see the [Jinja2 documentation](https://jinja.palletsprojects.com/en/3.1.x/), [CKAN Jinja2 documentation](https://docs.ckan.org/en/2.10/theming/templates.html#jinja2), and [CKAN theming documentation](https://docs.ckan.org/en/2.10/theming/templates.html#replacing-a-default-template-file).

#### Language selector

For the country flags to appear in the language selector it's needed to make sure there's an associated flag for each one of the configured languages. This must be done by further expanding the `/ckanext-querytool/ckanext/querytool/public/base/resources/lang-flags.json` file. Here's an example of what this file looks like:
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

### Backend

#### API/Actions

The process for creating/customizing the API endpoints (Actions) is the slightly different than the [CKAN documentation](https://docs.ckan.org/en/2.10/extensions/index.html), but this is only because we have automated `get_actions` in `plugin.py` to return all actions found in [`ckanext-querytool/ckanext/querytool/logic/action`](ckanext/querytool/logic/action) (in this directory, we have 4 files: `create.py`, `delete.py`, `get.py`, and `update.py`, all of which are included in the automated loading), so they don't need to be added individually. We do this with the following code (found in [`plugin.py`](ckanext/querytool/plugin.py):
```
module_root = 'ckanext.querytool.logic.action'
action_functions = h._get_functions(module_root)
```

As a basic example, let's say we want to create a new GET endpoint that simply returns the text "This is our new API endpoint!".

1. We would simply add the following code to [`ckanext-querytool/ckanext/querytool/logic/action/get.py`](querytool/logic/action/get.py):
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

The process for creating/customizing helpers is the same as found in the [CKAN helper documentation](https://docs.ckan.org/en/2.10/theming/templates.html#adding-your-own-template-helper-functions).

As a basic example, let's say we want to create a new helper that simply returns the text "This is our new helper!".

1. We would start by adding the following code to [`ckanext-querytool/ckanext/querytool/helpers.py`](ckanext/querytool/helpers.py):
    ```
    def our_new_helper():
        return 'This is our new helper!'
    ```
2. Add our new helper to `get_helpers` in [`plugin.py`](ckanext/querytool/plugin.py):
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

For a better idea of what helpers can be used for, you can take a look at the helpers in [`ckanext-querytool/ckanext/querytool/helpers.py`](ckanext/querytool/helpers.py) and [CKAN core helpers](https://github.com/ckan/ckan/blob/ckan-2.10.4/ckan/lib/helpers.py).

#### Visualizations Object

If you need to intercept or add new keys/values to the backend visualizations or reports objects, you can find much of the code in [`/ckanext/querytool/controllers/querytool.py`](ckanext/querytool/controllers/querytool.py) (for example, `edit_visualizations` retrieves the saved values from the DB and returns them to the template) and [`/ckanext/querytool/model.py`](ckanext/querytool/model.py) (this is where new DB columns are added).

## Updating README

To update this README's table of contents, use `doctoc` (if you don't have it installed already, you can install in various ways, such as `npm install -g doctoc` or `pip install --user doctoc`).

```bash
doctoc README.md
```

## Config Settings

The extension supports some optional configurations:

- OpenStreetMaps
- Cookie Control
- reCAPTCHA v2 on login page

### Optional Map Config Settings

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

### Optional Cookie Control Config Settings

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

### Optional reCAPTCHA v2 on login page

It's possible o enable reCAPTCHA v2 on the login page by setting the following environment variables:

```bash
# Example values
ckanext.querytool.recaptcha.sitekey = 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
ckanext.querytool.recaptcha.secretkey = 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

## Google Analytics (GA4)

To setup Google Analytics using GA4, you need to install a specific branch (`ed-dev-ga4`) of the Datopian Google Analytics extension:

[`ckanext-googleanalytics` with GA4 support](https://github.com/datopian/ckanext-googleanalytics/tree/ed-dev-ga4)

Then follow the instructions in the ["Setup" section of the README](https://github.com/datopian/ckanext-googleanalytics/tree/ed-dev-ga4#setup).

