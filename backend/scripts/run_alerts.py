import logging

from app.jobs.alert_job import run_alert_job

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_alert_job()