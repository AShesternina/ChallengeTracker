"""add onboarding_completed to users

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-07
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "0009"
down_revision: Union[str, None] = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default="false"),
    )
    # Existing users have already completed onboarding
    op.execute("UPDATE users SET onboarding_completed = true")


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed")
