"""
Script to add role_permissions table to database.
Run this script to create the new table for RBAC.
"""
import sys
sys.path.insert(0, '/app')

from sqlalchemy import create_engine, text
import os

# Database connection
POSTGRES_USER = os.getenv('POSTGRES_USER', 'user')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'password')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'db')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'pegawai_db')

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

def add_role_permissions_table():
    """Add role_permissions table if not exists."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'role_permissions'
            );
        """))
        exists = result.scalar()
        
        if exists:
            print("Table 'role_permissions' already exists.")
            return
        
        # Create table
        conn.execute(text("""
            CREATE TABLE role_permissions (
                id SERIAL PRIMARY KEY,
                role VARCHAR(20) UNIQUE NOT NULL,
                permissions TEXT DEFAULT '[]' NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            CREATE INDEX idx_role_permissions_role ON role_permissions(role);
        """))
        conn.commit()
        print("Table 'role_permissions' created successfully.")


def update_user_roles():
    """Update existing user roles to new format."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Update 'admin' role to 'superadmin'
        result = conn.execute(text("""
            UPDATE users SET role = 'superadmin' WHERE role = 'admin';
        """))
        conn.commit()
        print(f"Updated {result.rowcount} admin users to superadmin.")
        
        # Update 'user' role to 'viewer'
        result = conn.execute(text("""
            UPDATE users SET role = 'viewer' WHERE role = 'user';
        """))
        conn.commit()
        print(f"Updated {result.rowcount} user roles to viewer.")


if __name__ == "__main__":
    print("Adding role_permissions table...")
    add_role_permissions_table()
    print("\nUpdating user roles...")
    update_user_roles()
    print("\nDone!")
