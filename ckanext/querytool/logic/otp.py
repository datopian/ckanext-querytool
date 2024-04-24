from ckan.plugins import toolkit as tk
import logging
from ckan.types import Context, DataDict, ActionResult
from ckanext.querytool.model import VitalsSecurityTOTP
import ckan.model as model
import datetime
from ckan.common import _, config
import ckan.lib.mailer as mailer
log = logging.getLogger(__name__)
import pyotp

def send_2fa_code(context: Context, data_dict: DataDict):
    print("TESTING", flush=True)
    try:
        user = data_dict.get("user")
        print(data_dict, flush=True)
        print(context, flush=True)
        user_dict = tk.get_action("user_show")(None, {"id": user})
        # Get user object instead
        user_obj = model.User.get(user)
        print(user_obj, flush=True)
        vs_totp = VitalsSecurityTOTP()
        now = datetime.datetime.utcnow()
        print(now, flush=True)
        challenge = vs_totp.create_for_user(user_dict["name"], created_at=now)
        secret = challenge.secret
        totp = pyotp.TOTP(secret)
        current_code = totp.at(for_time=now)
        user_display_name = user_dict["name"]
        user_email = user_obj.email
        email_subject = _("Verification Code")
        email_body = _(
            "Hi {user},\n\nHere's your verification"
            " code to login: {code}\n\nHave a great day!"
        ).format(user=user_display_name, code=current_code)
        site_title = config.get("ckan.site_title")
        site_url = config.get("ckan.site_url")

        email_body += "\n\n" + site_title + "\n" + site_url

        mail = mailer.mail_recipient(user_display_name, user_email, email_subject, email_body)
        print(mail, flush=True)

        return {"success": True, "msg": "Email sent"}
    except Exception as e:
        return {"success": False, "msg": "Error sending email"}
