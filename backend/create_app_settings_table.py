"""
Script to create app_settings table.
Run this once to add the table to existing database.
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

def create_app_settings_table():
    """Create app_settings table if not exists."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if table exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'app_settings'
            );
        """))
        exists = result.scalar()
        
        if exists:
            print("Table 'app_settings' already exists.")
            return
        
        # Create table
        conn.execute(text("""
            CREATE TABLE app_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX idx_app_settings_key ON app_settings(key);
        """))
        conn.commit()
        print("Table 'app_settings' created successfully.")


if __name__ == "__main__":
    print("Creating app_settings table...")
    create_app_settings_table()
    print("Done!")
