"""add new challenge templates (v2 library)

Revision ID: 0020
Revises: 0019
Create Date: 2026-05-11
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0020"
down_revision: Union[str, None] = "0019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_TEMPLATES = [
    # 🥗 Health & Nutrition
    {
        "title": "Blood Pressure Check",
        "description": "Track your blood pressure 3 times a day",
        "type": "multi",
        "default_duration_days": 30,
        "tasks_per_day": 3,
        "task_times": '["08:00","14:00","20:00"]',
        "icon": "💓",
        "slug": "blood-pressure-check",
    },
    {
        "title": "Daily Vegetables",
        "description": "Eat vegetables every day — your body will thank you",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🥦",
        "slug": "daily-vegetables",
    },
    # 📚 Education
    {
        "title": "Read 20 Pages",
        "description": "Read at least 20 pages every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "📖",
        "slug": "read-20-pages",
    },
    {
        "title": "1 Course Lesson Daily",
        "description": "Complete one lesson of your online course every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["19:00"]',
        "icon": "🎓",
        "slug": "1-course-lesson-daily",
    },
    {
        "title": "Learn 20 Words",
        "description": "Learn 20 new words in a foreign language every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["09:00"]',
        "icon": "🔤",
        "slug": "learn-20-words",
    },
    {
        "title": "Coding Practice",
        "description": "Practice coding for at least 30 minutes every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["10:00"]',
        "icon": "💻",
        "slug": "coding-practice",
    },
    # 💼 Productivity
    {
        "title": "Deep Work 2 Hours",
        "description": "Work with full focus for 2 hours without distractions",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["10:00"]',
        "icon": "🎯",
        "slug": "deep-work-2-hours",
    },
    {
        "title": "Daily Planning",
        "description": "Plan tomorrow every evening — 10 minutes for a better day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "📋",
        "slug": "daily-planning",
    },
    {
        "title": "3 Main Tasks",
        "description": "Pick 3 most important tasks every morning and complete them",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["09:00"]',
        "icon": "✅",
        "slug": "3-main-tasks",
    },
    # 🧹 Home & Order
    {
        "title": "15 Min Cleaning",
        "description": "Spend 15 minutes cleaning every day — small steps, big results",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["18:00"]',
        "icon": "🧹",
        "slug": "15-min-cleaning",
    },
    {
        "title": "Clean Desk",
        "description": "Keep your desk clean every evening before bed",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["20:00"]',
        "icon": "🖥️",
        "slug": "clean-desk",
    },
    {
        "title": "Declutter",
        "description": "Find one thing to throw away, donate, or organize every day",
        "type": "single",
        "default_duration_days": 21,
        "tasks_per_day": 1,
        "task_times": '["18:00"]',
        "icon": "📦",
        "slug": "declutter",
    },
    {
        "title": "Minimalism 1 Item",
        "description": "Let go of one unnecessary item every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["18:00"]',
        "icon": "🗑️",
        "slug": "minimalism-1-item",
    },
    # 💰 Finance
    {
        "title": "Daily Expense Tracking",
        "description": "Log all your expenses every evening",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "💸",
        "slug": "daily-expense-tracking",
    },
    {
        "title": "No Spend Day",
        "description": "Spend no money today — practice financial discipline",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "💰",
        "slug": "no-spend-day",
    },
    {
        "title": "Daily Savings",
        "description": "Set aside a fixed amount every day — build your safety net",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "🏦",
        "slug": "daily-savings",
    },
    {
        "title": "Financial Journal",
        "description": "Write down your financial goals and progress every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["21:00"]',
        "icon": "📓",
        "slug": "financial-journal",
    },
    # 🚫 Quit Habits
    {
        "title": "No Alcohol",
        "description": "Stay alcohol-free — every sober day counts",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🍷",
        "slug": "no-alcohol",
    },
    {
        "title": "No Smoking",
        "description": "Quit smoking — your lungs will start recovering in 24 hours",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🚭",
        "slug": "no-smoking",
    },
    {
        "title": "No Swearing",
        "description": "Go 7 days without swearing — train your speech and mind",
        "type": "all_day",
        "default_duration_days": 7,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "🤐",
        "slug": "no-swearing",
    },
    # ❤️ Relationships
    {
        "title": "Call Loved Ones",
        "description": "Call a family member or close friend every day",
        "type": "single",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": '["19:00"]',
        "icon": "📞",
        "slug": "call-loved-ones",
    },
    {
        "title": "Family Time",
        "description": "Spend quality time with family — phones away",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "👨‍👩‍👧",
        "slug": "family-time",
    },
    {
        "title": "Meet a Friend",
        "description": "Meet or meaningfully connect with a friend every day",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "👥",
        "slug": "meet-a-friend",
    },
    {
        "title": "Self-Care Day",
        "description": "Do something just for yourself — you deserve it",
        "type": "all_day",
        "default_duration_days": 30,
        "tasks_per_day": 1,
        "task_times": None,
        "icon": "💆",
        "slug": "self-care-day",
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    for tpl in NEW_TEMPLATES:
        conn.execute(
            sa.text(
                "INSERT INTO challenge_templates "
                "(title, description, type, default_duration_days, tasks_per_day, task_times, icon, slug) "
                "VALUES (:title, :description, CAST(:type AS challengetype), "
                ":default_duration_days, :tasks_per_day, :task_times, :icon, :slug)"
            ),
            tpl,
        )


def downgrade() -> None:
    conn = op.get_bind()
    titles = [t["title"] for t in NEW_TEMPLATES]
    conn.execute(
        sa.text("DELETE FROM challenge_templates WHERE title = ANY(:titles)"),
        {"titles": titles},
    )
