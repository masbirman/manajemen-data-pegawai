"""
Migration script to add manual_override column to pegawai table.
This allows tracking which status changes were made manually by users.
"""
import sys
import os
from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_manual_override_column():
    """Add manual_override column to pegawai table."""
    try:
        # Get database configuration from environment variables
        POSTGRES_USER = os.getenv("POSTGRES_USER", "user")
        POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
        POSTGRES_DB = os.getenv("POSTGRES_DB", "pegawai_db")
        POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
        POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
        
        DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
        
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='pegawai' AND column_name='manual_override'
            """))
            
            if result.fetchone():
                logger.info("Column 'manual_override' already exists. Skipping migration.")
                return
            
            # Add the column
            logger.info("Adding 'manual_override' column to pegawai table...")
            conn.execute(text("""
                ALTER TABLE pegawai 
                ADD COLUMN manual_override INTEGER DEFAULT 0 NOT NULL
            """))
            conn.commit()
            
            logger.info("✓ Successfully added 'manual_override' column")
            logger.info("✓ All existing records set to manual_override=0 (not overridden)")
            
    except Exception as e:
        logger.error(f"Error adding manual_override column: {e}")
        sys.exit(1)


if __name__ == "__main__":
    logger.info("Starting migration: Add manual_override column")
    add_manual_override_column()
    logger.info("Migration completed successfully!")
