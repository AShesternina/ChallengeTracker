"""add email_verification_token to users

Revision ID: 0018
Revises: 0017
Create Date: 2026-05-11
"""
from alembic import op
import sqlalchemy as sa

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("email_verification_token", sa.String(64), nullable=True))


def downgrade():
    op.drop_column("users", "email_verification_token")
