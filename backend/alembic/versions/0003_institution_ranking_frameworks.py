"""Add institutions.ranking_frameworks (frameworks an institution reports against).

NULL means every framework is available, so existing institutions are unchanged.

Revision ID: 0003_ranking_frameworks
Revises: 0002_institution_modules
Create Date: 2026-09-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_ranking_frameworks"
down_revision: Union[str, None] = "0002_institution_modules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # main.py also adds this column at startup (ADD COLUMN IF NOT EXISTS);
    # guard so running both paths never fails.
    bind = op.get_bind()
    columns = {c["name"] for c in sa.inspect(bind).get_columns("institutions")}
    if "ranking_frameworks" not in columns:
        op.add_column("institutions", sa.Column("ranking_frameworks", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("institutions", "ranking_frameworks")
