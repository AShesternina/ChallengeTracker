"""add source_template_id to challenges

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE challenges ADD COLUMN IF NOT EXISTS source_template_id INTEGER")


def downgrade() -> None:
    op.drop_column("challenges", "source_template_id")
