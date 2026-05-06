"""update challenge templates

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEMPLATES = [
    # --- Здоровье / Health ---
    {
        "title": "Healthy Sleep",
        "description": "Go to bed on time every night",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["22:30"]',
        "icon": "😴",
    },
    {
        "title": "8 Glasses of Water",
        "description": "Stay hydrated throughout the day",
        "type": "multi",
        "default_duration_days": 30,
        "tasks_per_day": 4,
        "task_times": '["09:00", "12:00", "15:00", "19:00"]',
        "icon": "💧",
    },
    {
        "title": "Daily Vitamins",
        "description": "Take your vitamins morning and evening",
        "type": "multi",
        "default_duration_days": 30,
        "tasks_per_day": 2,
        "task_times": '["08:00", "20:00"]',
        "icon": "💊",
    },
    {
        "title": "No Sugar",
        "description": "Avoid sugar for the whole day",
        "type": "all_day",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🚫",
    },
    # --- Продуктивность / Productivity ---
    {
        "title": "Morning Pages",
        "description": "Write 3 pages by hand right after waking up",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["07:00"]',
        "icon": "✍️",
    },
    {
        "title": "Pomodoro Method",
        "description": "Work in focused 25-minute sessions",
        "type": "multi",
        "default_duration_days": 30,
        "tasks_per_day": 4,
        "task_times": '["09:00", "11:00", "14:00", "16:00"]',
        "icon": "🍅",
    },
    {
        "title": "No Social Media Until Noon",
        "description": "Keep your mornings free from social media",
        "type": "all_day",
        "default_duration_days": 14,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "📵",
    },
    # --- Спорт / Sport ---
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
        "title": "Push-ups 3x Day",
        "description": "Build upper body strength with daily push-up sets",
        "type": "multi",
        "default_duration_days": 21,
        "tasks_per_day": 3,
        "task_times": '["08:00", "13:00", "19:00"]',
        "icon": "🏋️",
    },
    {
        "title": "10,000 Steps",
        "description": "Walk at least 10,000 steps every day",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🚶",
    },
    # --- Ментальное здоровье / Mental Health ---
    {
        "title": "Meditation",
        "description": "Daily mindfulness practice",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["08:00"]',
        "icon": "🧘",
    },
    {
        "title": "Breathing Practice",
        "description": "Calm your mind with breathing exercises",
        "type": "multi",
        "default_duration_days": 21,
        "tasks_per_day": 3,
        "task_times": '["08:00", "13:00", "21:00"]',
        "icon": "🌬️",
    },
    {
        "title": "Gratitude Journal",
        "description": "Write down 3 things you are grateful for today",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🙏",
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM challenge_templates"))
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
