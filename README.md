[![Build Status](https://travis-ci.org/ViderumGlobal/ckanext-querytool.svg?branch=master)](https://travis-ci.org/ViderumGlobal/ckanext-querytool)

# Querytool

## Installation

To install ckanext-querytool:

1. Activate your CKAN virtual environment, for example:

```
. /usr/lib/ckan/default/bin/activate
```

2. Install the ckanext-querytool Python package into your virtual environment:

```
pip install ckanext-querytool
```

3. Add ``querytool`` to the ``ckan.plugins`` setting in your CKAN
   config file (by default the config file is located at
   ``/etc/ckan/default/production.ini``).

4. Restart CKAN. For example if you've deployed CKAN with Apache on Ubuntu:

```
sudo service apache2 reload
```


## Config Settings

These are the required configuration options used by the extension:

1. Add config for application groups in a comma separated key:value pairs:
```
ckanext.querytool.groups = brazil:Brazil,china:营养,mexico:Mexico
```

2. Add config for map item base layer:
```
ckanext.querytool.map_osm_url = https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}

ckanext.querytool.map_osm_attribute = Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ
```

## Development Installation

To install ckanext-querytool for development, activate your CKAN virtualenv
and do:

```
git clone https://github.com/ViderumGlobal/ckanext-querytool.git
cd ckanext-querytool
python setup.py develop
pip install -r dev-requirements.txt
```
All code MUST follow [PEP8 Style Guide](https://www.python.org/dev/peps/pep-0008/). Most editors have plugins or integrations and automatic checking for PEP8 compliance so make sure you use them.

You should add a pre-commit hook that will
check for PEP8 errors. Follow the next steps to enable this check.

1. Make sure you have installed the PEP8 style checker:
```
$ pip install pycodestyle
```
2. In the `.git/hooks` folder which is located inside the project's root
directory, create a file named `pre-commit` and inside put [this code](https://github.com/keitaroinc/pep8-git-hook/blob/master/pre-commit).
3. Make `pre-commit` executable by running this command:
```
$ chmod +x ckanext-querytool/.git/hooks/pre-commit
```
Now, every time you commit code, the pre-commit hook will run and check for
PEP8 errors.


## Modify CSS

This extension uses LESS for styles. All changes must be made in one of the LESS
files located in the `ckanext-querytool/ckanext/querytool/fanstatic/less` folder.

Gulp.js is used for building CSS assets.

In order to build all CSS assets **run `node_modules/gulp/bin/gulp.js` once**. Gulp.js is watching for changes in the source LESS assets and will rebuild CSS on each change. If you have gulp.js installed globally on the system, you can just type `gulp` to run it.

## Running the Tests

To run the tests, first make sure that you have installed the required
development dependencies in CKAN, which can be done by running the following
command in the CKAN's `src` directory:

```
pip install -r dev-requirements.txt
```

After that just type this command to actually run the tests in the extension.

```
nosetests --ckan --with-pylons=test.ini
```
To run the tests and produce a coverage report, first make sure you have coverage installed in your virtualenv (pip install coverage) then run:

```
nosetests --nologcapture --with-pylons=test.ini --with-coverage --cover-package=ckanext.querytool --cover-inclusive --cover-erase --cover-tests
```
