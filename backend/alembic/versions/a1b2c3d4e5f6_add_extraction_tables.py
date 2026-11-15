"""add extraction tables (parties, clauses, events, obligations, payment_terms, penalties)

Revision ID: a1b2c3d4e5f6
Revises: 10e9a1f41d4f
Create Date: 2026-09-25 12:00:00.000000

contract_parties and contract_events already exist (created by 10e9a1f41d4f),
so they are altered to the extraction schema instead of being created.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '10e9a1f41d4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PARTY_TYPES = ('COMPANY', 'INDIVIDUAL', 'GOVERNMENT', 'OTHER')
PARTY_ROLES = ('CLIENT', 'SERVICE_PROVIDER', 'SUPPLIER', 'CUSTOMER', 'PARTNER', 'EMPLOYER', 'EMPLOYEE', 'LANDLORD', 'TENANT', 'OTHER')
EVENT_TYPES = ('START', 'EXPIRATION', 'RENEWAL', 'RENEWAL_NOTICE_DEADLINE', 'PAYMENT', 'TERMINATION_NOTICE', 'DELIVERY', 'MILESTONE', 'OTHER')


def upgrade() -> None:
    # --- Contract Parties (alter existing table) ---
    sa.Enum(*PARTY_TYPES, name='partytype').create(op.get_bind())
    sa.Enum(*PARTY_ROLES, name='partyrole').create(op.get_bind())
    op.alter_column('contract_parties', 'type', type_=sa.Enum(*PARTY_TYPES, name='partytype'),
                    postgresql_using='upper(type)::partytype', nullable=True)
    op.alter_column('contract_parties', 'role', type_=sa.Enum(*PARTY_ROLES, name='partyrole'),
                    postgresql_using='upper(role)::partyrole', nullable=True)
    op.alter_column('contract_parties', 'address', type_=sa.String())
    op.add_column('contract_parties', sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()))
    op.drop_constraint('contract_parties_contract_id_fkey', 'contract_parties', type_='foreignkey')
    op.create_foreign_key('contract_parties_contract_id_fkey', 'contract_parties', 'contracts',
                          ['contract_id'], ['id'], ondelete='CASCADE')

    # --- Clauses ---
    op.create_table(
        'clauses',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('contract_id', sa.Integer(), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_number', sa.String(50), nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('type', sa.Enum(
            'GENERAL', 'SCOPE', 'PAYMENT', 'PRICE', 'DELIVERY', 'CONFIDENTIALITY',
            'DATA_PROTECTION', 'INTELLECTUAL_PROPERTY', 'LIABILITY', 'WARRANTY',
            'PENALTY', 'TERMINATION', 'RENEWAL', 'NOTICE', 'GOVERNING_LAW',
            'DISPUTE_RESOLUTION', 'FORCE_MAJEURE', 'INSURANCE', 'AUDIT',
            'NON_COMPETE', 'NON_SOLICITATION', 'OTHER',
            name='clausetype'
        ), nullable=True),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('page_start', sa.Integer(), nullable=True),
        sa.Column('page_end', sa.Integer(), nullable=True),
        sa.Column('is_important', sa.Boolean(), server_default='false'),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_clauses_id', 'clauses', ['id'])
    op.create_index('ix_clauses_contract_id', 'clauses', ['contract_id'])

    # --- Contract Events (alter existing table) ---
    sa.Enum(*EVENT_TYPES, name='eventtype').create(op.get_bind())
    op.alter_column('contract_events', 'type', type_=sa.Enum(*EVENT_TYPES, name='eventtype'),
                    postgresql_using='upper(type)::eventtype')
    op.alter_column('contract_events', 'date', nullable=True)
    # clause_id now points at the new clauses table; old contract_clauses ids are not valid there
    op.drop_constraint('contract_events_clause_id_fkey', 'contract_events', type_='foreignkey')
    op.execute("UPDATE contract_events SET clause_id = NULL")
    op.create_foreign_key('contract_events_clause_id_fkey', 'contract_events', 'clauses',
                          ['clause_id'], ['id'], ondelete='SET NULL')
    op.drop_constraint('contract_events_contract_id_fkey', 'contract_events', type_='foreignkey')
    op.create_foreign_key('contract_events_contract_id_fkey', 'contract_events', 'contracts',
                          ['contract_id'], ['id'], ondelete='CASCADE')

    # --- Obligations ---
    op.create_table(
        'obligations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('contract_id', sa.Integer(), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_id', sa.Integer(), sa.ForeignKey('clauses.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('obligation_type', sa.String(100), nullable=True),
        sa.Column('responsible_party_id', sa.Integer(), sa.ForeignKey('contract_parties.id', ondelete='SET NULL'), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('frequency', sa.String(50), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'COMPLETED', 'OVERDUE', name='obligationstatus'), server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_obligations_id', 'obligations', ['id'])
    op.create_index('ix_obligations_contract_id', 'obligations', ['contract_id'])

    # --- Payment Terms ---
    op.create_table(
        'payment_terms',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('contract_id', sa.Integer(), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_id', sa.Integer(), sa.ForeignKey('clauses.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(10), nullable=True),
        sa.Column('payment_type', sa.Enum(
            'FIXED', 'INSTALLMENT', 'MONTHLY', 'QUARTERLY', 'MILESTONE', 'ADVANCE', 'OTHER',
            name='paymenttype'
        ), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('due_days', sa.Integer(), nullable=True),
        sa.Column('frequency', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_payment_terms_id', 'payment_terms', ['id'])
    op.create_index('ix_payment_terms_contract_id', 'payment_terms', ['contract_id'])

    # --- Penalties ---
    op.create_table(
        'penalties',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('contract_id', sa.Integer(), sa.ForeignKey('contracts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('clause_id', sa.Integer(), sa.ForeignKey('clauses.id', ondelete='SET NULL'), nullable=True),
        sa.Column('type', sa.String(100), nullable=True),
        sa.Column('amount', sa.Float(), nullable=True),
        sa.Column('percentage', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(10), nullable=True),
        sa.Column('trigger', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_penalties_id', 'penalties', ['id'])
    op.create_index('ix_penalties_contract_id', 'penalties', ['contract_id'])


def downgrade() -> None:
    op.drop_table('penalties')
    op.drop_table('payment_terms')
    op.drop_table('obligations')

    # --- revert contract_events ---
    op.drop_constraint('contract_events_contract_id_fkey', 'contract_events', type_='foreignkey')
    op.create_foreign_key('contract_events_contract_id_fkey', 'contract_events', 'contracts', ['contract_id'], ['id'])
    op.drop_constraint('contract_events_clause_id_fkey', 'contract_events', type_='foreignkey')
    op.execute("UPDATE contract_events SET clause_id = NULL")
    op.create_foreign_key('contract_events_clause_id_fkey', 'contract_events', 'contract_clauses', ['clause_id'], ['id'])
    op.execute("DELETE FROM contract_events WHERE date IS NULL")
    op.alter_column('contract_events', 'date', nullable=False)
    op.alter_column('contract_events', 'type', type_=sa.String(100), postgresql_using='type::text')

    op.drop_table('clauses')

    # --- revert contract_parties ---
    op.drop_constraint('contract_parties_contract_id_fkey', 'contract_parties', type_='foreignkey')
    op.create_foreign_key('contract_parties_contract_id_fkey', 'contract_parties', 'contracts', ['contract_id'], ['id'])
    op.drop_column('contract_parties', 'created_at')
    op.alter_column('contract_parties', 'address', type_=sa.String(500))
    op.execute("UPDATE contract_parties SET type = 'OTHER' WHERE type IS NULL")
    op.execute("UPDATE contract_parties SET role = 'OTHER' WHERE role IS NULL")
    op.alter_column('contract_parties', 'role', type_=sa.String(100), postgresql_using='role::text', nullable=False)
    op.alter_column('contract_parties', 'type', type_=sa.String(100), postgresql_using='type::text', nullable=False)

    op.execute("DROP TYPE IF EXISTS partytype")
    op.execute("DROP TYPE IF EXISTS partyrole")
    op.execute("DROP TYPE IF EXISTS clausetype")
    op.execute("DROP TYPE IF EXISTS eventtype")
    op.execute("DROP TYPE IF EXISTS obligationstatus")
    op.execute("DROP TYPE IF EXISTS paymenttype")
