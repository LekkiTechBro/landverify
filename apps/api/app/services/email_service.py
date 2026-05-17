"""
Email Service â€” powered by Resend.
All transactional emails for LandVerify.
"""
import os
import httpx

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("EMAIL_FROM", "onboarding@resend.dev")
BASE_URL = "https://api.resend.com/emails"

BRAND = """
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#f5f5f5;padding:24px">
  <div style="background:#0A5C3F;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">Land<span style="color:#FAC775">Verify</span></h1>
    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Nigeria's most secure real estate platform</p>
  </div>
  <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
    {CONTENT}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#aaa;font-size:11px;text-align:center;margin:0">
      LandVerify &mdash; Find a home with zero title risk.<br/>
      You received this email because you have an account on LandVerify.
    </p>
  </div>
</div>
"""

async def send_email(to: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY or RESEND_API_KEY == "placeholder":
        print(f"[EMAIL] Would send to {to}: {subject}")
        return True
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                BASE_URL,
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                json={"from": FROM_EMAIL, "to": to, "subject": subject, "html": html},
            )
            if res.status_code not in (200, 201):
                print(f"[EMAIL ERROR] {res.status_code}: {res.text}")
                return False
            return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


async def send_welcome_email(to: str, name: str, role: str) -> bool:
    role_msg = "You can now list properties, manage your CRM pipeline, and grow your real estate business." if role == "agent" \
        else "You can now search verified properties, save favourites, and purchase safely via escrow."
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">Welcome, {name}!</h2>
        <p style="color:#555;line-height:1.7">Your LandVerify account has been created successfully.</p>
        <p style="color:#555;line-height:1.7">{role_msg}</p>
        <div style="background:#E1F5EE;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#0A5C3F;margin:0;font-size:14px;font-weight:500">
            Every property on LandVerify is registry-verified and agent KYC-cleared.
          </p>
        </div>
        <a href="http://localhost:3005/auth/login" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Get Started
        </a>
    """
    return await send_email(to, "Welcome to LandVerify", BRAND.replace("{CONTENT}", content))


async def send_login_notification_email(to: str, name: str) -> bool:
    from datetime import datetime
    now = datetime.utcnow().strftime("%d %b %Y at %H:%M UTC")
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">New Login Detected</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, a new login to your LandVerify account was detected.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#555;margin:0;font-size:13px">Time: <strong>{now}</strong></p>
        </div>
        <p style="color:#555;line-height:1.7">If this was not you, please reset your password immediately.</p>
        <a href="http://localhost:3005/auth/forgot-password" style="display:inline-block;background:#C62828;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Reset Password
        </a>
    """
    return await send_email(to, "New Login to Your LandVerify Account", BRAND.replace("{CONTENT}", content))


async def send_kyc_verified_email(to: str, name: str) -> bool:
    content = f"""
        <h2 style="color:#0A5C3F;margin:0 0 12px">NIN Verified Successfully</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, your NIN has been verified against the NIMC national registry.</p>
        <div style="background:#E1F5EE;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
          <div style="font-size:40px;margin-bottom:8px">&#10003;</div>
          <p style="color:#0A5C3F;margin:0;font-weight:600;font-size:16px">Identity Verified</p>
          <p style="color:#0A5C3F;margin:4px 0 0;font-size:13px">Your Verified badge is now active</p>
        </div>
        <p style="color:#555;line-height:1.7">You can now list properties and access all LandVerify features.</p>
    """
    return await send_email(to, "Your NIN Has Been Verified â€” LandVerify", BRAND.replace("{CONTENT}", content))


async def send_kyc_rejected_email(to: str, name: str, reason: str) -> bool:
    content = f"""
        <h2 style="color:#C62828;margin:0 0 12px">NIN Verification Failed</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, your NIN verification was unsuccessful.</p>
        <div style="background:#FDECEA;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#C62828;margin:0;font-size:13px"><strong>Reason:</strong> {reason}</p>
        </div>
        <p style="color:#555;line-height:1.7">Please check your details and try again.</p>
        <a href="http://localhost:3005/kyc" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Try Again
        </a>
    """
    return await send_email(to, "NIN Verification Failed â€” LandVerify", BRAND.replace("{CONTENT}", content))


async def send_payment_confirmed_email(to: str, name: str, property_title: str, amount: str, reference: str) -> bool:
    content = f"""
        <h2 style="color:#0A5C3F;margin:0 0 12px">Payment Confirmed</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, your escrow payment has been received and secured.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:20px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#888;font-size:13px;padding:6px 0">Property</td><td style="color:#333;font-size:13px;font-weight:500;text-align:right">{property_title}</td></tr>
            <tr><td style="color:#888;font-size:13px;padding:6px 0">Amount</td><td style="color:#0A5C3F;font-size:13px;font-weight:600;text-align:right">{amount}</td></tr>
            <tr><td style="color:#888;font-size:13px;padding:6px 0">Reference</td><td style="color:#333;font-size:12px;font-family:monospace;text-align:right">{reference}</td></tr>
            <tr><td style="color:#888;font-size:13px;padding:6px 0">Status</td><td style="color:#0A5C3F;font-size:13px;font-weight:500;text-align:right">Secured in Escrow</td></tr>
          </table>
        </div>
        <div style="background:#FFF3CD;border-radius:8px;padding:12px;margin:16px 0">
          <p style="color:#856404;font-size:12px;margin:0;line-height:1.6">
            Your funds are held securely in escrow and will only be released to the seller after title transfer is complete and verified.
          </p>
        </div>
        <a href="http://localhost:3005/buyer" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          View My Portal
        </a>
    """
    return await send_email(to, f"Payment Confirmed â€” {property_title}", BRAND.replace("{CONTENT}", content))


async def send_property_listed_email(to: str, name: str, property_title: str) -> bool:
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">Property Submitted for Verification</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, your property <strong>{property_title}</strong> has been submitted successfully.</p>
        <div style="background:#FFF3CD;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#856404;margin:0;font-size:14px">
            Our team will verify your documents within 24 hours. You will receive another email once your listing goes live.
          </p>
        </div>
        <a href="http://localhost:3005/dashboard" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          View Dashboard
        </a>
    """
    return await send_email(to, f"Property Submitted â€” {property_title}", BRAND.replace("{CONTENT}", content))


async def send_enquiry_to_agent_email(to: str, agent_name: str, buyer_name: str, property_title: str, message: str) -> bool:
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">New Enquiry on Your Property</h2>
        <p style="color:#555;line-height:1.7">Hi {agent_name}, you have a new enquiry on <strong>{property_title}</strong>.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#888;font-size:12px;margin:0 0 6px">From: <strong style="color:#333">{buyer_name}</strong></p>
          <p style="color:#333;font-size:14px;margin:0;line-height:1.6">{message}</p>
        </div>
        <a href="http://localhost:3005/chat" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          Reply in CRM
        </a>
    """
    return await send_email(to, f"New Enquiry â€” {property_title}", BRAND.replace("{CONTENT}", content))


async def send_enquiry_confirmation_to_buyer_email(to: str, buyer_name: str, property_title: str) -> bool:
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">Enquiry Sent Successfully</h2>
        <p style="color:#555;line-height:1.7">Hi {buyer_name}, your enquiry about <strong>{property_title}</strong> has been sent to the agent.</p>
        <div style="background:#E1F5EE;border-radius:8px;padding:16px;margin:20px 0">
          <p style="color:#0A5C3F;margin:0;font-size:14px">The agent will respond to you shortly. You can track your enquiries in your portal.</p>
        </div>
        <a href="http://localhost:3005/buyer" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          My Portal
        </a>
    """
    return await send_email(to, f"Enquiry Sent â€” {property_title}", BRAND.replace("{CONTENT}", content))


async def send_milestone_advanced_email(to: str, name: str, property_title: str, milestone: str, amount: str) -> bool:
    content = f"""
        <h2 style="color:#0A5C3F;margin:0 0 12px">Escrow Milestone Update</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, your escrow for <strong>{property_title}</strong> has been updated.</p>
        <div style="background:#E1F5EE;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
          <p style="color:#0A5C3F;font-weight:600;font-size:16px;margin:0">{milestone}</p>
          <p style="color:#0A5C3F;font-size:13px;margin:4px 0 0">Amount: {amount}</p>
        </div>
        <a href="http://localhost:3005/buyer" style="display:inline-block;background:#0A5C3F;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
          View Escrow Status
        </a>
    """
    return await send_email(to, f"Escrow Update â€” {property_title}", BRAND.replace("{CONTENT}", content))


async def send_password_reset_email(to: str, name: str, reset_url: str) -> bool:
    content = f"""
        <h2 style="color:#222;margin:0 0 12px">Reset Your Password</h2>
        <p style="color:#555;line-height:1.7">Hi {name}, we received a request to reset your LandVerify password.</p>
        <a href="{reset_url}" style="display:inline-block;background:#0A5C3F;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;font-size:15px">
          Reset Password
        </a>
        <p style="color:#888;font-size:12px;line-height:1.6">This link expires in 1 hour. If you did not request a password reset, please ignore this email â€” your account is safe.</p>
    """
    return await send_email(to, "Reset Your LandVerify Password", BRAND.replace("{CONTENT}", content))

