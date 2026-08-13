"""baseline: schema already applied by db/init and historical backend/migrations

Revision ID: 0001_baseline
Revises:
Create Date: 2026-08-13
"""

from typing import Sequence, Union

revision: str = "0001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing databases (and docker db/init on first boot) already have the schema.
    # Stamp this revision, then add real upgrades with:
    #   alembic revision --autogenerate -m "your change"
    pass


def downgrade() -> None:
    pass
