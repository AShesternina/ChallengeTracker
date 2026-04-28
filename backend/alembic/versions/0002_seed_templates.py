"""seed challenge templates

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEMPLATES = [
    {
        "title": "Morning Workout",
        "description": "Daily morning exercise session",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["07:00"]',
        "icon": "💪",
    },
    {
        "title": "Reading Habit",
        "description": "Read at least 20 pages every day",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "📚",
    },
    {
        "title": "Meditation",
        "description": "Morning and evening meditation sessions",
        "type": "multi",
        "default_duration_days": 21,
        "tasks_per_day": 2,
        "task_times": '["08:00", "20:00"]',
        "icon": "🧘",
    },
    {
        "title": "No Sugar",
        "description": "Avoid sugar for the whole day",
        "type": "all_day",
        "default_duration_days": 14,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🚫🍬",
    },
    {
        "title": "Water Intake",
        "description": "Drink 8 glasses of water per day",
        "type": "multi",
        "default_duration_days": 30,
        "tasks_per_day": 3,
        "task_times": '["09:00", "13:00", "18:00"]',
        "icon": "💧",
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    for tpl in TEMPLATES:
        conn.execute(
            sa.text(
                "INSERT INTO challenge_templates (title, description, type, default_duration_days, tasks_per_day, task_times, icon) "
                "VALUES (:title, :description, CAST(:type AS challengetype), :default_duration_days, :tasks_per_day, :task_times, :icon)"
            ),
            tpl,
        )


def downgrade() -> None:
    op.execute("DELETE FROM challenge_templates")
