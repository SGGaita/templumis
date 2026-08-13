"""Alembic entry point used by deploy and manage.py."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.database import engine

ROOT = Path(__file__).resolve().parent
ALEMBIC_INI = ROOT / "alembic.ini"


def alembic_config() -> Config:
    return Config(str(ALEMBIC_INI))


def run_pending() -> None:
    cfg = alembic_config()
    tables = inspect(engine).get_table_names()
    if "alembic_version" not in tables and "users" in tables:
        print("Existing database detected — stamping Alembic head (no replay).")
        command.stamp(cfg, "head")
    command.upgrade(cfg, "head")
    print("Alembic is at head.")


if __name__ == "__main__":
    run_pending()
