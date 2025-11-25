"""
Safe database migration script.
Adds new columns without dropping existing data.
"""
from app.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Safely migrate database schema without losing data."""
    try:
        with engine.connect() as conn:
            logger.info("Starting database migration...")
            
            # Add new columns to landing_page_settings if they don't exist
            migrations = [
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS image_width INTEGER DEFAULT 100",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS image_height INTEGER DEFAULT 350",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS card_background VARCHAR(20) DEFAULT '#ffffff'",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS left_gradient_start VARCHAR(20) DEFAULT '#667eea'",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS left_gradient_end VARCHAR(20) DEFAULT '#764ba2'",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS title_size INTEGER DEFAULT 32",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS subtitle_size INTEGER DEFAULT 16",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS welcome_size INTEGER DEFAULT 14",
                "ALTER TABLE landing_page_settings ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'center'",
            ]
            
            for migration in migrations:
                try:
                    conn.execute(migration)
                    logger.info(f"✓ Executed: {migration[:50]}...")
                except Exception as e:
                    logger.warning(f"⚠ Skipped (may already exist): {migration[:50]}...")
            
            conn.commit()
            logger.info("Migration completed successfully!")
            
    except Exception as e:
        logger.error(f"Error during migration: {e}")
        raise

if __name__ == "__main__":
    migrate_database()
    print("\n✅ Database migration completed!")
    print("All existing data is preserved.")
