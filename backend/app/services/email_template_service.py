"""
Builds the daily alert digest email (subject, plain text, HTML).

The HTML is written for email clients, not browsers: tables for layout,
inline styles, no SVG or web fonts (Gmail and Outlook drop them).
Severity tiers and colors match the web app (critical < 7 days,
warning 7-30, upcoming 30-90).
"""
from html import escape

from app.config import settings
from app.services.alert_rules import severity_for

EVENT_LABELS = {
    "EXPIRATION": "Contract expiration",
    "RENEWAL": "Renewal",
    "RENEWAL_NOTICE_DEADLINE": "Renewal notice deadline",
    "TERMINATION_NOTICE": "Termination notice deadline",
    "PAYMENT": "Payment due",
    "DELIVERY": "Delivery",
    "MILESTONE": "Milestone",
}

# (label, strong color, soft background) per severity, same palette as the web app
SEVERITY_STYLES = {
    "critical": ("Critical", "#b91c1c", "#fef2f2"),
    "warning": ("Warning", "#b45309", "#fffbeb"),
    "upcoming": ("Upcoming", "#1d4ed8", "#eff6ff"),
}

BRAND = "#2563eb"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"


def _when(days_left: int) -> str:
    if days_left <= 0:
        return "today"
    if days_left == 1:
        return "tomorrow"
    return f"in {days_left} days"


def _subject(rows: list[dict]) -> str:
    n = len(rows)
    urgent = sum(1 for r in rows if r["severity"] == "critical")
    if urgent:
        return f"[ContractAlert] {urgent} deadline{'s' if urgent > 1 else ''} within 7 days ({n} in total)"
    return f"[ContractAlert] {n} upcoming contract deadline{'s' if n > 1 else ''}"


def _row_html(r: dict) -> str:
    label, strong, soft = SEVERITY_STYLES[r["severity"]]
    description = (
        f'<p style="margin:6px 0 0;font-size:13px;line-height:19px;color:#475569">{escape(r["description"])}</p>'
        if r["description"] else ""
    )
    return f"""
          <tr>
            <td style="padding:0 0 12px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                     style="border:1px solid #e2e8f0;border-left:4px solid {strong};border-radius:8px;background:#ffffff">
                <tr>
                  <td style="padding:14px 16px">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:15px;font-weight:600;color:#0f172a">{escape(r['label'])}</td>
                        <td align="right" style="white-space:nowrap">
                          <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:{soft};color:{strong};font-size:12px;font-weight:600">{label} &middot; {escape(r['when'])}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:4px 0 0;font-size:14px;color:#0f172a">{escape(r['contract'])}</p>
                    <p style="margin:2px 0 0;font-size:13px;color:#64748b">{escape(r['parties'])} &middot; {escape(r['date'])}</p>
                    {description}
                  </td>
                </tr>
              </table>
            </td>
          </tr>"""


def build_digest(alerts):
    alerts = sorted(alerts, key=lambda a: a.days_left)
    app_url = settings.APP_URL.rstrip("/")

    rows = []
    for a in alerts:
        e = a.event
        c = e.contract
        rows.append({
            "contract": c.title,
            "parties": f"{c.party_a} / {c.party_b}",
            "label": EVENT_LABELS.get(e.type.value, "Contract event"),
            "date": e.date.strftime("%d/%m/%Y"),
            "when": _when(a.days_left),
            "severity": severity_for(a.days_left) or "upcoming",
            "description": e.description or "",
        })

    n = len(rows)
    subject = _subject(rows)
    intro = f"{n} contract deadline{'s need' if n > 1 else ' needs'} your attention."

    # --- Plain text ---
    text = f"Hello,\n\n{intro}\n\n"
    text += "\n\n".join(
        f"[{SEVERITY_STYLES[r['severity']][0].upper()}] {r['label']}, {r['when']} ({r['date']})\n"
        f"{r['contract']} ({r['parties']})"
        + (f"\n{r['description']}" if r["description"] else "")
        for r in rows
    )
    if app_url:
        text += f"\n\nOpen ContractAlert: {app_url}/alerts"
    text += "\n\nYou're receiving this because you own these contracts in ContractAlert."

    # --- HTML ---
    button = f"""
          <tr>
            <td style="padding:8px 0 4px">
              <a href="{escape(app_url)}/alerts"
                 style="display:inline-block;padding:10px 18px;border-radius:8px;background:{BRAND};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Open ContractAlert</a>
            </td>
          </tr>""" if app_url else ""

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>{escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:{FONT}">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">{escape(intro)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9">
    <tr>
      <td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
          <tr>
            <td style="padding:0 4px 16px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="28" height="28" align="center" valign="middle"
                      style="width:28px;height:28px;border-radius:7px;background:{BRAND};color:#ffffff;font-size:16px;font-weight:700;line-height:28px">!</td>
                  <td style="padding-left:8px;font-size:17px;font-weight:700;color:#0f172a">Contract<span style="color:{BRAND}">Alert</span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:0 0 4px;font-size:20px;font-weight:700;color:#0f172a">Upcoming contract deadlines</td>
                </tr>
                <tr>
                  <td style="padding:0 0 20px;font-size:14px;color:#475569">Hello, {escape(intro)}</td>
                </tr>
                {''.join(_row_html(r) for r in rows)}
                {button}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 8px 0;font-size:12px;line-height:18px;color:#64748b">
              You're receiving this because you own these contracts in ContractAlert.
              Reminders go out ahead of renewals, notice deadlines, payments and expirations.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return subject, text, html
