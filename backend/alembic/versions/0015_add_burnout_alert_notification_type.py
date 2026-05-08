"""add burnout_alert to NotificationType enum

Revision ID: 0015
Revises: 0014
Create Date: 2026-05-08
"""
from typing import Union
from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'burnout_alert'")


def downgrade() -> None:
    pass
