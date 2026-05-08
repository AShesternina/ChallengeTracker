"""add telegram fields to users and telegram channel to notification_log

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-08
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telegram_chat_id", sa.BigInteger(), nullable=True))
    op.add_column("users", sa.Column("telegram_linking_code", sa.String(20), nullable=True))
    op.execute("ALTER TYPE notificationchannel ADD VALUE IF NOT EXISTS 'telegram'")


def downgrade() -> None:
    op.drop_column("users", "telegram_chat_id")
    op.drop_column("users", "telegram_linking_code")
