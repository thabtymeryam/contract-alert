"""obligation assignee

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-10-29 18:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('obligations', sa.Column('responsible_user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'obligations_responsible_user_id_fkey', 'obligations', 'users',
        ['responsible_user_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('ix_obligations_responsible_user_id'), 'obligations', ['responsible_user_id'], unique=False)
    # OVERDUE is now computed from the due date; stored rows go back to PENDING
    op.execute("UPDATE obligations SET status = 'PENDING' WHERE status = 'OVERDUE' OR status IS NULL")


def downgrade() -> None:
    op.drop_index(op.f('ix_obligations_responsible_user_id'), table_name='obligations')
    op.drop_constraint('obligations_responsible_user_id_fkey', 'obligations', type_='foreignkey')
    op.drop_column('obligations', 'responsible_user_id')
