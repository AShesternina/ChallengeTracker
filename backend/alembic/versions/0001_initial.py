"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-04-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=True),
        sa.Column("phone", sa.String(20), unique=True, nullable=True),
        sa.Column("hashed_password", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(64), server_default="UTC"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false()),
        sa.Column("otp_code", sa.String(6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_phone", "users", ["phone"])

    op.create_table(
        "challenges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "type",
            sa.Enum("single", "multi", "all_day", name="challengetype"),
            server_default="single",
        ),
        sa.Column("default_duration_days", sa.Integer(), server_default="30"),
        sa.Column("tasks_per_day", sa.Integer(), server_default="1"),
        sa.Column("task_times", sa.Text(), nullable=True),
        sa.Column("is_template", sa.Boolean(), server_default=sa.false()),
    )

    op.create_table(
        "challenge_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "type",
            sa.Enum("single", "multi", "all_day", name="challengetype"),
            server_default="single",
        ),
        sa.Column("default_duration_days", sa.Integer(), server_default="30"),
        sa.Column("tasks_per_day", sa.Integer(), server_default="1"),
        sa.Column("task_times", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(64), nullable=True),
    )

    op.create_table(
        "challenge_instances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("challenge_id", sa.Integer(), sa.ForeignKey("challenges.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "paused", "completed", "cancelled", name="instancestatus"),
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_challenge_instances_user_id", "challenge_instances", ["user_id"])

    op.create_table(
        "daily_task_instances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "challenge_instance_id",
            sa.Integer(),
            sa.ForeignKey("challenge_instances.id"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("scheduled_time", sa.Time(), nullable=True),
        sa.Column(
            "type",
            sa.Enum("single", "multi", "all_day", name="tasktype"),
            server_default="single",
        ),
        sa.Column(
            "status",
            sa.Enum("pending", "completed", "skipped", name="taskstatus"),
            server_default="pending",
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_daily_task_instances_user_id", "daily_task_instances", ["user_id"])
    op.create_index("ix_daily_task_instances_date", "daily_task_instances", ["date"])

    op.create_table(
        "user_devices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("push_subscription", sa.Text(), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_devices_user_id", "user_devices", ["user_id"])

    op.create_table(
        "notification_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "morning_summary", "task_reminder", "daily_report", name="notificationtype"
            ),
        ),
        sa.Column(
            "channel", sa.Enum("push", "email", name="notificationchannel")
        ),
        sa.Column(
            "status",
            sa.Enum("sent", "failed", "pending", name="notificationstatus"),
            server_default="pending",
        ),
        sa.Column("payload", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notification_logs_user_id", "notification_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("user_devices")
    op.drop_table("daily_task_instances")
    op.drop_table("challenge_instances")
    op.drop_table("challenge_templates")
    op.drop_table("challenges")
    op.drop_table("users")
