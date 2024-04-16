import click


@click.command()
def init_totp():
    """Initializes the TOTP table
    """
    print(
        "Initializing database for multi-factor authentication "
        "(TOTP - Time-based One-Time Password)"
    )
    from ckanext.querytool.model import VitalsSecurityTOTP
    vs_totp = VitalsSecurityTOTP()
    vs_totp.totp_db_setup()
    print("Finished tables setup for multi-factor authentication")
