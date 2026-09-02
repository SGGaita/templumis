"""Add institutions.enabled_modules for per-tenant module access.

Revision ID: 0002_institution_modules
Revises: 0001_baseline
Create Date: 2026-09-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_institution_modules"
down_revision: Union[str, None] = "0001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "institutions",
        sa.Column("enabled_modules", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("institutions", "enabled_modules")
