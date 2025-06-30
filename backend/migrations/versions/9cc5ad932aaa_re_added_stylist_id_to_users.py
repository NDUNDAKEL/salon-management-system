"""Re-added stylist_id to users

Revision ID: 9cc5ad932aaa
Revises: 1cfce7b01b42
Create Date: 2025-06-28 16:04:08.448282
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '9cc5ad932aaa'
down_revision = '1cfce7b01b42'
branch_labels = None
depends_on = None

def upgrade():
    # Modify stylists table: make user_id nullable and drop FK constraint
    with op.batch_alter_table('stylists', schema=None) as batch_op:
        batch_op.drop_constraint('fk_stylists_user_id', type_='foreignkey')
        batch_op.alter_column('user_id',
                              existing_type=sa.INTEGER(),
                              nullable=True)

    # Add stylist_id column and FK to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stylist_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_users_stylist_id',  # Properly named constraint
            'stylists',
            ['stylist_id'],
            ['id']
        )

def downgrade():
    # Remove stylist_id column and FK from users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_stylist_id', type_='foreignkey')
        batch_op.drop_column('stylist_id')

    # Restore original stylists.user_id FK and NOT NULL constraint
    with op.batch_alter_table('stylists', schema=None) as batch_op:
        batch_op.alter_column('user_id',
                              existing_type=sa.INTEGER(),
                              nullable=False)
        batch_op.create_foreign_key(
            'fk_stylists_user_id',
            'users',
            ['user_id'],
            ['id']
        )
