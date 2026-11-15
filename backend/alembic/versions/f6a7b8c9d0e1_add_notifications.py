"""add notifications

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-10-29 19:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

notificationkind = sa.Enum(
    'DEADLINE', 'OBLIGATION_ASSIGNED', 'EXTRACTION_DONE', 'EXTRACTION_FAILED', name='notificationkind'
)


def upgrade() -> None:
    op.create_table('notifications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('kind', notificationkind, nullable=False),
    sa.Column('severity', sa.String(length=20), nullable=True),
    sa.Column('contract_id', sa.Integer(), nullable=True),
    sa.Column('contract_title', sa.String(length=255), nullable=True),
    sa.Column('params', sa.JSON(), nullable=False),
    sa.Column('link', sa.String(length=500), nullable=True),
    sa.Column('dedupe_key', sa.String(length=255), nullable=True),
    sa.Column('read_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('dedupe_key')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index('ix_notifications_user_unread', 'notifications', ['user_id', 'read_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_notifications_user_unread', table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')
    notificationkind.drop(op.get_bind(), checkfirst=True)
