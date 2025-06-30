"""Re-added stylist_id to users

Revision ID: b75cc8d90cc1
Revises: 9cc5ad932aaa
Create Date: 2025-06-28 16:27:06.304852
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b75cc8d90cc1'
down_revision = '9cc5ad932aaa'
branch_labels = None
depends_on = None

def upgrade():
    # Update 'stylists' table
    with op.batch_alter_table('stylists', schema=None) as batch_op:
        batch_op.alter_column('user_id',
            existing_type=sa.INTEGER(),
            nullable=False
        )
        batch_op.create_foreign_key(
            'fk_stylists_user_id',  # ✅ GIVE THE CONSTRAINT A NAME
            'users',
            ['user_id'],
            ['id']
        )

    # Drop 'stylist_id' from 'users' table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_stylist_id', type_='foreignkey')
        batch_op.drop_column('stylist_id')

def downgrade():
    # Re-add 'stylist_id' to 'users' table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stylist_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(
            'fk_users_stylist_id',  # ✅ NAMED CONSTRAINT AGAIN
            'stylists',
            ['stylist_id'],
            ['id']
        )

    # Remove foreign key from 'stylists'
    with op.batch_alter_table('stylists', schema=None) as batch_op:
        batch_op.drop_constraint('fk_stylists_user_id', type_='foreignkey')
        batch_op.alter_column('user_id',
            existing_type=sa.INTEGER(),
            nullable=True
        )
