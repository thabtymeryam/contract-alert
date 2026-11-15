import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.database import SessionLocal
from app.services.alert_service import process_alerts

logger = logging.getLogger(__name__)


def run_alert_job() -> None:
    db = SessionLocal()
    try:
        process_alerts(db)
    except Exception:
        logger.exception("Alert job crashed")
    finally:
        db.close()


def create_scheduler() -> BackgroundScheduler:
    tz = settings.ALERT_TIMEZONE
    cron = settings.ALERT_CRON
    scheduler = BackgroundScheduler(timezone=tz)
    scheduler.add_job(
        run_alert_job,
        CronTrigger.from_crontab(cron, timezone=tz),
        id="contract_alerts",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return scheduler