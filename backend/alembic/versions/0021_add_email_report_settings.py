"""add email report notification settings

Revision ID: 0021
Revises: 0020
Create Date: 2026-05-12
"""
from alembic import op
import sqlalchemy as sa

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("notify_email_daily", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("notify_email_weekly", sa.Boolean(), nullable=False, server_default="false"))


def downgrade():
    op.drop_column("users", "notify_email_weekly")
    op.drop_column("users", "notify_email_daily")
