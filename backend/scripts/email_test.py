"""
Preview or send the contract-alert email digest.

    # Render the digest to backend/email-preview.html (open it in a browser)
    docker compose exec backend python scripts/email_test.py preview

    # Send it to a real inbox through the SMTP settings in .env
    docker compose exec backend python scripts/email_test.py send --to you@example.com

By default the digest uses sample deadlines (one per severity tier). Add
--from-db to use the real upcoming events from the database instead.
Nothing is written to alert_logs, so this never stops a real alert from going out.
"""

import argparse
import smtplib
import sys
from datetime import date, timedelta
from types import SimpleNamespace

from app.config import settings
from app.database import SessionLocal
import app.models  # noqa: F401  (registers all models so relationships resolve)
from app.models.contract_event import EventType
from app.services.email_service import send_email
from app.services.email_template_service import build_digest

PREVIEW_PATH = "email-preview.html"


def sample_alerts() -> list:
    """One alert per tier, shaped like alert_service.DueAlert."""
    today = date.today()

    def alert(title, party_a, party_b, event_type, days_left, description):
        contract = SimpleNamespace(title=title, party_a=party_a, party_b=party_b)
        event = SimpleNamespace(
            type=event_type, date=today + timedelta(days=days_left), description=description,
            contract=contract, contract_id=0,
        )
        return SimpleNamespace(event=event, days_left=days_left, days_before=days_left)

    return [
        alert("Office lease — Lac 2", "Acme Tunisia SARL", "Immobilière du Lac", EventType.RENEWAL_NOTICE_DEADLINE, 1,
              "Written notice must reach the landlord 90 days before the lease renews."),
        alert("IT services agreement", "Acme Tunisia SARL", "Meridian Retail Group SA", EventType.PAYMENT, 5,
              "Monthly service fee of 5,000 TND, due within 30 days of invoice."),
        alert("Fleet insurance", "Acme Tunisia SARL", "STAR Assurances", EventType.EXPIRATION, 24,
              "Policy expires; renew or switch insurer before this date."),
        alert("Cloud hosting", "Acme Tunisia SARL", "Hostinger EU", EventType.RENEWAL, 60,
              "Auto-renews for 12 months unless cancelled."),
    ]


def db_alerts() -> list:
    """Upcoming events from the database, ignoring whether they were already emailed."""
    from sqlalchemy.orm import joinedload

    from app.models.contract_event import ContractEvent
    from app.services.alert_rules import ALERT_RULES, MAX_OFFSET

    today = date.today()
    with SessionLocal() as db:
        events = (
            db.query(ContractEvent)
            .options(joinedload(ContractEvent.contract))
            .filter(
                ContractEvent.date >= today,
                ContractEvent.date <= today + timedelta(days=MAX_OFFSET),
                ContractEvent.type.in_(list(ALERT_RULES.keys())),
            )
            .order_by(ContractEvent.date)
            .all()
        )
        return [SimpleNamespace(event=e, days_left=(e.date - today).days, days_before=0) for e in events]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    preview = sub.add_parser("preview", help=f"write the digest HTML to {PREVIEW_PATH}")
    preview.add_argument("--from-db", action="store_true", help="use real upcoming events")
    send = sub.add_parser("send", help="send the digest through SMTP")
    send.add_argument("--to", required=True, help="recipient address")
    send.add_argument("--from-db", action="store_true", help="use real upcoming events")
    args = parser.parse_args()

    alerts = db_alerts() if args.from_db else sample_alerts()
    if not alerts:
        sys.exit("No upcoming events in the database. Run without --from-db to use sample data.")
    subject, text, html = build_digest(alerts)

    if args.command == "preview":
        with open(PREVIEW_PATH, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Subject: {subject}")
        print(f"Wrote backend/{PREVIEW_PATH} ({len(alerts)} alert(s)). Open it in a browser.")
        return

    missing = [name for name in ("SMTP_HOST", "MAIL_FROM") if not getattr(settings, name)]
    if missing:
        sys.exit(f"Set {', '.join(missing)} in .env first (then restart the backend container).")

    mode = "SSL" if settings.SMTP_USE_SSL else "STARTTLS"
    print(f"Sending '{subject}' to {args.to} via {settings.SMTP_HOST}:{settings.SMTP_PORT} ({mode}) as {settings.MAIL_FROM}…")
    try:
        send_email(args.to, subject, text, html)
    except smtplib.SMTPAuthenticationError as e:
        sys.exit(f"SMTP login failed ({e.smtp_code}). For Gmail, use an App Password, not your normal password.")
    except (smtplib.SMTPException, OSError) as e:
        sys.exit(f"Sending failed: {e}")
    print("Sent. Check the inbox (and the spam folder).")


if __name__ == "__main__":
    main()
