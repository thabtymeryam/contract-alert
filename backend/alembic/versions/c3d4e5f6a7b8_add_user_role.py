"""add user role

Revision ID: c3d4e5f6a7b8
Revises: b12ccb0539ee
Create Date: 2026-10-29 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b12ccb0539ee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

userrole = sa.Enum('ADMIN', 'USER', name='userrole')


def upgrade() -> None:
    userrole.create(op.get_bind(), checkfirst=True)
    # Existing users become regular users; promote one with scripts/create_admin.py
    op.add_column('users', sa.Column('role', userrole, nullable=False, server_default='USER'))


def downgrade() -> None:
    op.drop_column('users', 'role')
    userrole.drop(op.get_bind(), checkfirst=True)
