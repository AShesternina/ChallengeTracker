"""add theme to users

Revision ID: 0017
Revises: 0016
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("theme", sa.String(10), nullable=False, server_default="light"))


def downgrade():
    op.drop_column("users", "theme")
