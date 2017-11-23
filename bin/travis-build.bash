set -e

echo "This is travis-install-dependencies..."

echo "Installing the packages that CKAN requires..."
sudo apt-get install postgresql-$PGVERSION solr-jetty

echo "Installing CKAN and its Python dependencies..."
git clone https://github.com/ckan/ckan
cd ckan
git checkout "ckan-2.7.2"
python setup.py develop
pip install -r requirements.txt
pip install -r dev-requirements.txt
pip install coveralls
cd -

echo "Creating the PostgreSQL user and database..."
sudo -u postgres psql -c "CREATE USER ckan_default WITH PASSWORD 'pass';"
sudo -u postgres psql -c 'CREATE DATABASE ckan_test WITH OWNER ckan_default;'

echo "Initialising the database..."
cd ckan
paster db init -c test-core.ini
cd -

echo "Installing ckanext-querytool and its requirements..."
python setup.py develop
pip install -r requirements.txt
pip install -r dev-requirements.txt

echo "travis-install-dependencies is done."