"""Cleaned models

Revision ID: 1cfce7b01b42
Revises: 317fbf472ddf
Create Date: 2025-06-28 15:52:24.495192
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1cfce7b01b42'
down_revision = '317fbf472ddf'
branch_labels = None
depends_on = None


def upgrade():
    # Modify 'stylists' table
    with op.batch_alter_table('stylists') as batch_op:
        # Drop any existing FK referencing stylist_id if needed here
        batch_op.drop_column('stylist_id')  # Safe if exists
        batch_op.alter_column('user_id', existing_type=sa.Integer(), nullable=False)
        batch_op.create_unique_constraint('uq_stylists_user_id', ['user_id'])

    # Modify 'users' table
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('stylist_id')  # Safe if exists


def downgrade():
    # Revert 'users' table
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('stylist_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_users_stylist_id', 'stylists', ['stylist_id'], ['id'])

    # Revert 'stylists' table
    with op.batch_alter_table('stylists') as batch_op:
        batch_op.add_column(sa.Column('stylist_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_stylists_stylist_id', 'stylists', ['stylist_id'], ['id'])
        batch_op.drop_constraint('uq_stylists_user_id', type_='unique')
        batch_op.alter_column('user_id', existing_type=sa.Integer(), nullable=True)
