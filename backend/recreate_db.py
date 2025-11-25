"""
Script to recreate database tables with new schema.
This will drop all existing tables and recreate them with the unit field.
"""
from app.database import engine, Base, init_db
from app.models.pegawai import Pegawai
from app.models.user import User, LandingPageSettings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def recreate_database():
    """Drop all tables and recreate them."""
    try:
        logger.info("Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully")
        
        logger.info("Creating new tables with updated schema...")
        init_db()
        logger.info("Database recreated successfully with unit field")
        
    except Exception as e:
        logger.error(f"Error recreating database: {e}")
        raise

if __name__ == "__main__":
    recreate_database()
    print("\n✅ Database recreated successfully!")
    print("You can now start uploading data with unit information.")
