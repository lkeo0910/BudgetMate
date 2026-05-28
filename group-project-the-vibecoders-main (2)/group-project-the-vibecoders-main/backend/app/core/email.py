from string import Template
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

# Path to the shared templates directory
TEMPLATE_DIR = Path(__file__).parent.parent / "shared" / "templates"

def send_otp_email(email_to: str, otp_code: str):
    """
    Sends an OTP verification email to the user with a beautiful HTML template.
    """
    subject = f"{otp_code} is your BudgetMate verification code"
    
    # Load HTML Template from file
    template_path = TEMPLATE_DIR / "otp_email.html"
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            html_template = f.read()
        # Use string.Template to avoid conflicts with CSS curly braces
        html_content = Template(html_template).safe_substitute(otp_code=otp_code)
    except FileNotFoundError:
        print(f"Email template not found at: {template_path}")
        # Fallback to a simple string if template is missing
        html_content = f"<h2>Verify your email address</h2><p>Your OTP code is: <b>{otp_code}</b></p>"

    # Plain text version for fallback
    text_content = f"Your BudgetMate verification code is: {otp_code}. It will expire in 5 minutes."

    # Create Message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = email_to

    part1 = MIMEText(text_content, "plain")
    part2 = MIMEText(html_content, "html")

    message.attach(part1)
    message.attach(part2)

    # Send Email
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.EMAILS_FROM_EMAIL, email_to, message.as_string())
    except Exception as e:
        # In production, you'd want to log this error properly
        print(f"Error sending email: {e}")
        raise e
