"""add templates and update icons

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_TEMPLATES = [
    {
        "title": "Evening Review",
        "description": "Reflect on your day: wins, lessons, tomorrow's focus",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "📝",
    },
    {
        "title": "Cold Shower",
        "description": "Start your day with a cold shower for energy and resilience",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["07:30"]',
        "icon": "🚿",
    },
    {
        "title": "Phone-Free Evening",
        "description": "No phone for one hour before bed — better sleep guaranteed",
        "type": "all_day",
        "default_duration_days": 14,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🌙",
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    # Fix No Sugar icon
    conn.execute(sa.text("UPDATE challenge_templates SET icon = '🍭' WHERE title = 'No Sugar'"))
    # Add new templates
    for tpl in NEW_TEMPLATES:
        conn.execute(
            sa.text(
                "INSERT INTO challenge_templates (title, description, type, default_duration_days, tasks_per_day, task_times, icon) "
                "VALUES (:title, :description, CAST(:type AS challengetype), :default_duration_days, :tasks_per_day, :task_times, :icon)"
            ),
            tpl,
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE challenge_templates SET icon = '🚫' WHERE title = 'No Sugar'"))
    conn.execute(sa.text(
        "DELETE FROM challenge_templates WHERE title IN ('Evening Review', 'Cold Shower', 'Phone-Free Evening')"
    ))
