"""extraction status on contracts; merge contract_clauses into clauses

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-10-29 17:00:00.000000

The /clauses API wrote to `contract_clauses` while AI extraction wrote to
`clauses`, so clauses edited through the API never showed up with the
extracted ones. Existing rows are copied into `clauses`, then the old table
is dropped.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

extractionstatus = sa.Enum('NONE', 'RUNNING', 'DONE', 'FAILED', name='extractionstatus')


def upgrade() -> None:
    extractionstatus.create(op.get_bind(), checkfirst=True)
    op.add_column('contracts', sa.Column('extraction_status', extractionstatus, nullable=False, server_default='NONE'))
    op.add_column('contracts', sa.Column('extracted_at', sa.DateTime(), nullable=True))
    op.add_column('contracts', sa.Column('extraction_error', sa.Text(), nullable=True))

    # Contracts that already have extracted data count as extracted
    op.execute("""
        UPDATE contracts SET extraction_status = 'DONE'
        WHERE id IN (SELECT contract_id FROM clauses UNION SELECT contract_id FROM contract_parties
                     UNION SELECT contract_id FROM contract_events)
    """)

    # Unknown free-text types become OTHER, since clauses.type is an enum
    op.execute("""
        INSERT INTO clauses (contract_id, clause_number, title, type, text, summary,
                             page_start, page_end, is_important, confidence, created_at, updated_at)
        SELECT contract_id, clause_number::text, title,
               CASE WHEN upper(type) IN (SELECT unnest(enum_range(NULL::clausetype))::text)
                    THEN upper(type)::clausetype ELSE 'OTHER'::clausetype END,
               text, summary, page_start, page_end, is_important, confidence, created_at, updated_at
        FROM contract_clauses
    """)
    op.drop_table('contract_clauses')


def downgrade() -> None:
    op.create_table('contract_clauses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('contract_id', sa.Integer(), nullable=False),
    sa.Column('clause_number', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('type', sa.String(length=100), nullable=False),
    sa.Column('text', sa.Text(), nullable=False),
    sa.Column('summary', sa.Text(), nullable=True),
    sa.Column('page_start', sa.Integer(), nullable=True),
    sa.Column('page_end', sa.Integer(), nullable=True),
    sa.Column('is_important', sa.Boolean(), nullable=False),
    sa.Column('confidence', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_contract_clauses_contract_id', 'contract_clauses', ['contract_id'], unique=False)
    op.create_index('ix_contract_clauses_id', 'contract_clauses', ['id'], unique=False)
    op.drop_column('contracts', 'extraction_error')
    op.drop_column('contracts', 'extracted_at')
    op.drop_column('contracts', 'extraction_status')
    extractionstatus.drop(op.get_bind(), checkfirst=True)
