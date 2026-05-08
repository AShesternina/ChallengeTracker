"""add weekly_review to NotificationType enum

Revision ID: 0013
Revises: 0012
Create Date: 2026-05-08
"""
from typing import Union
from alembic import op

revision: str = "0013"
down_revision: Union[str, None] = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'weekly_review'")


def downgrade() -> None:
    pass  # PostgreSQL does not support removing enum values
