"""add notification_morning_time and notification_evening_time to users

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-08
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("notification_morning_time", sa.String(5), nullable=True, server_default="08:00"))
    op.add_column("users", sa.Column("notification_evening_time", sa.String(5), nullable=True, server_default="21:00"))


def downgrade() -> None:
    op.drop_column("users", "notification_morning_time")
    op.drop_column("users", "notification_evening_time")
