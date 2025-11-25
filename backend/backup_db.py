"""
Script to backup database before any destructive operations.
"""
from app.database import engine
import logging
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def backup_database():
    """Create a backup of the database."""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"backup_{timestamp}.sql"
        
        # PostgreSQL connection details from environment
        db_user = os.getenv("POSTGRES_USER", "user")
        db_name = os.getenv("POSTGRES_DB", "pegawai_db")
        db_host = os.getenv("POSTGRES_HOST", "db")
        
        # Create backup using pg_dump
        backup_cmd = f"pg_dump -U {db_user} -h {db_host} {db_name} > /app/backups/{backup_file}"
        
        logger.info(f"Creating backup: {backup_file}")
        os.system(backup_cmd)
        logger.info(f"Backup created successfully: {backup_file}")
        
        return backup_file
        
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        raise

if __name__ == "__main__":
    # Create backups directory if not exists
    os.makedirs("/app/backups", exist_ok=True)
    backup_database()
    print("\n✅ Database backup created successfully!")
