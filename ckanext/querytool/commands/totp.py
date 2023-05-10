from ckan.lib.cli import CkanCommand

import sys


class VitalsSecurity(CkanCommand):
    '''Command for initializing the TOTP table
        Usage: paster --plugin=ckanext-querytool totp <command> -c <path to config file>

            command:
            help  - prints this help
            init_totp - create the database table to support time based one time (TOTP) login
        '''
    summary = __doc__.split('\n')[0]
    usage = __doc__

    def command(self):
        # load pylons config
        self._load_config()
        options = {
            'init_totp': self.init_totp,
            'help': self.help,
        }

        try:
            cmd = self.args[0]
            options[cmd](*self.args[1:])
        except KeyError:
            self.help()
            sys.exit(1)

    def help(self):
        print(self.__doc__)

    def init_totp(self):
        print(
            "Initializing database for multi-factor authentication "
            "(TOTP - Time-based One-Time Password)"
        )
        from ckanext.querytool.model import VitalsSecurityTOTP
        vs_totp = VitalsSecurityTOTP()
        vs_totp.totp_db_setup()
        print("Finished tables setup for multi-factor authentication")
