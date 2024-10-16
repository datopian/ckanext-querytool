import click

from ckanext.querytool.commands.camstat import camstat
from ckanext.querytool.commands.seed import seed
from ckanext.querytool.commands.totp import init_totp


@click.group(short_help='QueryTool CLI commands')
def vs():
    pass


vs.add_command(camstat, 'update-camstat')
vs.add_command(seed, 'seed')
vs.add_command(init_totp, 'init-totp')
