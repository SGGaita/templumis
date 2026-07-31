"""
Email service for sending verification and notification emails
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_verification_email(to_email: str, full_name: str, verification_code: str):
    """Send email verification code to user"""
    
    subject = "Verify Your TemplumIS Account"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .code-box {{
                background: white;
                border: 2px dashed #667eea;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
            }}
            .code {{
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to TemplumIS!</h1>
            </div>
            <div class="content">
                <h2>Hello {full_name},</h2>
                <p>Thank you for registering with TemplumIS. To complete your registration and verify your email address, please use the verification code below:</p>
                
                <div class="code-box">
                    <div class="code">{verification_code}</div>
                </div>
                
                <p>This verification code will expire in <strong>30 minutes</strong>.</p>
                
                <p>If you didn't create an account with TemplumIS, please ignore this email.</p>
                
                <p>Best regards,<br>
                The TemplumIS Team</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; 2026 TemplumIS. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Welcome to TemplumIS!
    
    Hello {full_name},
    
    Thank you for registering with TemplumIS. To complete your registration and verify your email address, please use the verification code below:
    
    Verification Code: {verification_code}
    
    This verification code will expire in 30 minutes.
    
    If you didn't create an account with TemplumIS, please ignore this email.
    
    Best regards,
    The TemplumIS Team
    """
    
    send_email(to_email, subject, html_body, text_body)


def _email_shell(title: str, body_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%); color: white; padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 28px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; padding: 12px 28px; background: #1e3a5f; color: white !important; text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: 600; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>{title}</h1></div>
            <div class="content">{body_html}</div>
            <div class="footer">
                <p>This is an automated message from TemplumIS.</p>
            </div>
        </div>
    </body>
    </html>
    """


def send_reviewer_invite_email(
    *,
    to_email: str,
    full_name: str,
    invite_url: str,
    scholarship_name: str,
    anonymized_id: str,
    invited_by: str,
) -> bool:
    subject = f"Scholarship reviewer invitation — {scholarship_name}"
    html_body = _email_shell(
        "Reviewer account invitation",
        f"""
        <h2>Hello {full_name},</h2>
        <p>{invited_by} has invited you to review a scholarship application on TemplumIS.</p>
        <p><strong>Application:</strong> {anonymized_id}<br>
        <strong>Scholarship:</strong> {scholarship_name}</p>
        <p>Create your reviewer account to access the blind review task:</p>
        <p><a class="button" href="{invite_url}">Set up reviewer account</a></p>
        <p>This invitation link expires in 7 days. After setup you will see the review in <strong>New Review Tasks</strong>.</p>
        """,
    )
    text_body = (
        f"Hello {full_name},\n\n"
        f"{invited_by} invited you to review {anonymized_id} ({scholarship_name}).\n"
        f"Create your account: {invite_url}\n"
    )
    return send_email(to_email, subject, html_body, text_body)


def send_review_task_email(
    *,
    to_email: str,
    full_name: str,
    scholarship_name: str,
    anonymized_id: str,
    task_url: str,
    invited_by: str,
) -> bool:
    subject = f"New scholarship review task — {anonymized_id}"
    html_body = _email_shell(
        "New review task",
        f"""
        <h2>Hello {full_name},</h2>
        <p>{invited_by} assigned you a scholarship application to review.</p>
        <p><strong>Application:</strong> {anonymized_id}<br>
        <strong>Scholarship:</strong> {scholarship_name}</p>
        <p><a class="button" href="{task_url}">Open review task</a></p>
        <p>Sign in to your reviewer dashboard to score this application.</p>
        """,
    )
    text_body = (
        f"Hello {full_name},\n\n"
        f"{invited_by} assigned you review task {anonymized_id} ({scholarship_name}).\n"
        f"Open: {task_url}\n"
    )
    return send_email(to_email, subject, html_body, text_body)


def send_email(to_email: str, subject: str, html_body: str, text_body: str):
    """Send email using SMTP"""
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.FROM_EMAIL
        message["To"] = to_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Connect to SMTP server and send
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        
        print(f"✓ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to send email to {to_email}: {e}")
        return False
