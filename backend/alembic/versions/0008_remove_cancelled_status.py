"""remove cancelled status from instancestatus enum

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE challenge_instances SET status = 'completed' WHERE status = 'cancelled'")
    op.execute("ALTER TYPE instancestatus RENAME TO instancestatus_old")
    op.execute("CREATE TYPE instancestatus AS ENUM ('active', 'paused', 'completed')")
    op.execute(
        "ALTER TABLE challenge_instances "
        "ALTER COLUMN status TYPE instancestatus "
        "USING status::text::instancestatus"
    )
    op.execute("DROP TYPE instancestatus_old")


def downgrade() -> None:
    op.execute("ALTER TYPE instancestatus RENAME TO instancestatus_old")
    op.execute("CREATE TYPE instancestatus AS ENUM ('active', 'paused', 'completed', 'cancelled')")
    op.execute(
        "ALTER TABLE challenge_instances "
        "ALTER COLUMN status TYPE instancestatus "
        "USING status::text::instancestatus"
    )
    op.execute("DROP TYPE instancestatus_old")
