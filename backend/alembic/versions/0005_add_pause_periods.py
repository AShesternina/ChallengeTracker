"""add pause_periods to challenge_instances

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE challenge_instances ADD COLUMN IF NOT EXISTS pause_periods TEXT")


def downgrade() -> None:
    op.drop_column("challenge_instances", "pause_periods")
