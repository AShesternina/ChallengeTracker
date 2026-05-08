"""add notify_task_reminders to users

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-08
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("notify_task_reminders", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("users", "notify_task_reminders")
