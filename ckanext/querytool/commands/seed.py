import logging
import requests
import click

from ckan.lib.search import rebuild
import ckan.model as model
import ckan.logic as logic
from ckan.plugins import toolkit
import os
from sqlalchemy import exc

log = logging.getLogger(__name__)


RESOURCES = {
    "ac98ee9a-0193-49ed-b0c3-c6d2b9a9090e": "steps_portal_alcohol.csv",
    "7e41b140-d68d-4f95-84ef-99026798d63e": "steps_portal_alcohol_vn.csv",
    "d515cca7-612f-4840-8b07-14277146ef99": "steps_portal_cholesterol.csv",
    "17b6135e-0690-4100-b680-5aeaed77b923": "steps_portal_cholesterol_vn.csv",
    "c298ca18-2944-4484-a484-3025f24b3c5c": "steps_portal_diabetes_time.csv",
    "8160b9cf-b6d0-4b2b-8b19-7ba9a86518a7": "steps_portal_diabetes_time_vn.csv",
    "d7271660-0dfc-4ab6-b30b-c7b3118db3d2": "steps_portal_diet.csv",
    "8b7d278e-d7c7-45f9-8e4b-9829a39beb94": "steps_portal_diet_vn.csv",
    "0bb6a5ce-4d1d-4e77-973c-afe062c8dcc8": "steps_portal_hypertension.csv",
    "7359dc1d-a43c-4152-bf87-dd6401088505": "steps_portal_hypertension_vn.csv",
    "4e007771-3f88-414e-abf5-85fa324cd5ef": "steps_portal_obesity.csv",
    "ebc56be4-8271-498b-bb6a-f7011ae5b3cf": "steps_portal_obesity_vn.csv",
    "f0f749d3-25f4-4f4f-9a24-7277d68d5d24": "steps_portal_others.csv",
    "63cdb7a4-9ecf-4d55-a795-4d1a4756166d": "steps_portal_others_vn.csv",
    "afac1e1a-fa53-485c-8059-05ab40e9a148": "steps_portal_physical.csv",
    "10f93403-63aa-453e-8090-186b1915f5bd": "steps_portal_physical_vn.csv",
    "bd2b92f0-2e53-433f-8103-2e29c7082cff": "steps_portal_tobacco.csv",
    "9fceacf5-e2a0-4632-b66c-fafd324f4b18": "steps_portal_tobacco_bd.csv",
}


@click.command()
def seed():
    """
    Seed the portal with test organizations, groups, datasets, reports, and visualizations
    """

    resources_exist = []

    for id, resource in list(RESOURCES.items()):
        try:
            toolkit.get_action("resource_show")({}, {"id": id})
            print("\nERROR: The resource {} already exists. ")
            resources_exist.append((id, resource))
        except logic.NotFound:
            continue

    if len(resources_exist) > 0:
        print("\nERROR: The portal already has seed data: \n\n")

        for id, resource in resources_exist:
            print(f"Resource ID: {id}\nResource Name: {resource}\n\n")

        print("Exiting...\n")
        quit()

    admin_name = input("\nEnter the admin login name: ")
    admin_api_key = input("\nEnter the admin API key: ")

    try:
        admin = toolkit.get_action("user_show")({}, {"id": admin_name})
    except logic.NotFound:
        print('\nERROR: "{}" is not a valid name. Try again.\n'.format(admin_name))
        quit()

    admin_id = str(admin.get("id"))

    connection = model.Session.connection()
    current_path = os.path.dirname(__file__)
    seed_path = os.path.join(current_path, "..", "seed", "dump.sql")
    seed_resource_dir = os.path.join(current_path, "..", "seed", "resources")

    sql = ""

    with open(seed_path, "r") as f:
        sql = f.read()

    sql = sql.replace("CKAN_ADMIN_ID", admin_id)
    sql = sql.replace("CKAN_ADMIN_NAME", admin_name)

    try:
        connection.execute(sql)
        model.Session.flush()
        model.Session.commit()
    except exc.IntegrityError:
        print(
            "\nERROR: The DB has existing data that's conflicting with "
            "this tool. This command must be run on a fresh DB.\n"
        )
        model.Session.rollback()
        quit()
    except Exception as e:
        print("\nERROR: {}\n".format(e))
        model.Session.rollback()
        quit()

    print("\nUploading resources...\n")

    for id, resource in list(RESOURCES.items()):
        try:
            print("Uploading resource: {}".format(resource))

            with open(os.path.join(seed_resource_dir, resource), "rb") as f:
                requests.post(
                    "http://0.0.0.0:5000/api/action/resource_update",
                    data={"id": id},
                    headers={"X-CKAN-API-Key": admin_api_key},
                    files=[("upload", f)],
                )
        except Exception as e:
            print("\nError uploading {}: {}".format(resource, e))

    print("\nSuccessfully seeded the portal with test data!\n")
