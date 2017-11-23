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
```

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
