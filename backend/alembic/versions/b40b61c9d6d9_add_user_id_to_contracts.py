"""add user_id to contracts

Revision ID: b40b61c9d6d9
Revises: 52f6a6c6bc40
Create Date: 2026-09-12 18:19:30.676144
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b40b61c9d6d9'
down_revision: Union[str, None] = '52f6a6c6bc40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id column to contracts as nullable
    op.add_column(
        'contracts',
        sa.Column('user_id', sa.Integer(), nullable=True)
    )

    # Create foreign key constraint with SET NULL on delete
    op.create_foreign_key(
        'contracts_user_id_fkey',
        'contracts',
        'users',
        ['user_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Drop the old foreign key from users to contracts
    op.drop_constraint(
        'users_contract_id_fkey',
        'users',
        type_='foreignkey'
    )

    # Drop the contract_id column from users
    op.drop_column('users', 'contract_id')


def downgrade() -> None:
    # Add contract_id back to users
    op.add_column('users', sa.Column('contract_id', sa.INTEGER(), autoincrement=False, nullable=False))

    # Create foreign key from users to contracts
    op.create_foreign_key('users_contract_id_fkey', 'users', 'contracts', ['contract_id'], ['id'])

    # Drop foreign key from contracts to users
    op.drop_constraint('contracts_user_id_fkey', 'contracts', type_='foreignkey')

    # Drop user_id column from contracts
    op.drop_column('contracts', 'user_id')
