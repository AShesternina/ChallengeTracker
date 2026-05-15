"""replace No Late Snacks template with No Swearing

Revision ID: 0022
Revises: 0021
Create Date: 2026-05-15
"""
from alembic import op
import sqlalchemy as sa

revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE challenge_templates
        SET
            title = 'No Swearing',
            description = 'Go 7 days without swearing — train your speech and mind',
            type = 'all_day',
            default_duration_days = 7,
            tasks_per_day = 1,
            task_times = NULL,
            icon = '🤐',
            slug = 'no-swearing'
        WHERE slug = 'no-late-snacks'
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE challenge_templates
        SET
            title = 'No Late Snacks',
            description = 'Stop eating after 8pm — better sleep and metabolism',
            type = 'single',
            default_duration_days = 30,
            tasks_per_day = 1,
            task_times = '["20:00"]',
            icon = '🌙',
            slug = 'no-late-snacks'
        WHERE slug = 'no-swearing'
    """)
