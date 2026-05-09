"""add slug to challenge_templates

Revision ID: 0016
Revises: 0015
Create Date: 2026-05-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SLUG_MAP = {
    "Healthy Sleep": "healthy-sleep",
    "8 Glasses of Water": "8-glasses-of-water",
    "Daily Vitamins": "daily-vitamins",
    "No Sugar": "no-sugar",
    "Morning Pages": "morning-pages",
    "Pomodoro Method": "pomodoro-method",
    "No Social Media Until Noon": "no-social-media-until-noon",
    "Morning Workout": "morning-workout",
    "Push-ups 3x Day": "push-ups-3x-day",
    "10,000 Steps": "10000-steps",
    "Meditation": "meditation",
    "Breathing Practice": "breathing-practice",
    "Gratitude Journal": "gratitude-journal",
    "Evening Review": "evening-review",
    "Cold Shower": "cold-shower",
    "Phone-Free Evening": "phone-free-evening",
}


def upgrade() -> None:
    op.add_column("challenge_templates", sa.Column("slug", sa.String(100), nullable=True))
    conn = op.get_bind()
    for title, slug in SLUG_MAP.items():
        conn.execute(
            sa.text("UPDATE challenge_templates SET slug = :slug WHERE title = :title"),
            {"slug": slug, "title": title},
        )
    op.alter_column("challenge_templates", "slug", nullable=True)
    op.create_unique_constraint("uq_challenge_templates_slug", "challenge_templates", ["slug"])


def downgrade() -> None:
    op.drop_constraint("uq_challenge_templates_slug", "challenge_templates", type_="unique")
    op.drop_column("challenge_templates", "slug")
