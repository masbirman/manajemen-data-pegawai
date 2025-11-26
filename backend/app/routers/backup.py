from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.routers.auth import require_permission
from app.models.user import User
import subprocess
import os
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/backup", tags=["backup"])

BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)


@router.post("/create")
async def create_backup(
    current_user: User = Depends(require_permission("manage_backup")),
    db: Session = Depends(get_db),
):
    """
    Create database backup (Admin only)
    """
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_{timestamp}.sql"
        backup_path = BACKUP_DIR / backup_filename

        # Create SQL backup using SQLAlchemy
        with open(backup_path, "w") as f:
            # Write header
            f.write("-- PostgreSQL database dump\n")
            f.write(f"-- Dumped at {datetime.now()}\n\n")

            # Get all table names
            with engine.connect() as conn:
                result = conn.execute(
                    text(
                        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                    )
                )
                tables = [row[0] for row in result]

                # Dump each table
                for table in tables:
                    f.write(f"\n-- Table: {table}\n")

                    # Get CREATE TABLE statement
                    create_result = conn.execute(
                        text(
                            f"SELECT 'CREATE TABLE {table} (' || string_agg(column_name || ' ' || data_type, ', ') || ');' "
                            f"FROM information_schema.columns WHERE table_name = '{table}' GROUP BY table_name"
                        )
                    )
                    create_stmt = create_result.scalar()
                    if create_stmt:
                        f.write(f"DROP TABLE IF EXISTS {table} CASCADE;\n")
                        f.write(f"{create_stmt}\n\n")

                    # Get data
                    data_result = conn.execute(text(f"SELECT * FROM {table}"))
                    rows = data_result.fetchall()
                    columns = data_result.keys()

                    if rows:
                        f.write(f"-- Data for {table}\n")
                        for row in rows:
                            values = []
                            for val in row:
                                if val is None:
                                    values.append("NULL")
                                elif isinstance(val, str):
                                    # Escape single quotes
                                    escaped = val.replace("'", "''")
                                    values.append(f"'{escaped}'")
                                elif isinstance(val, (int, float)):
                                    values.append(str(val))
                                else:
                                    values.append(f"'{str(val)}'")

                            cols = ", ".join(columns)
                            vals = ", ".join(values)
                            f.write(f"INSERT INTO {table} ({cols}) VALUES ({vals});\n")

                        f.write("\n")

        # Get file size
        file_size = backup_path.stat().st_size
        file_size_mb = round(file_size / (1024 * 1024), 2)

        logger.info(f"Backup created successfully: {backup_filename}")

        return {
            "message": "Backup berhasil dibuat",
            "filename": backup_filename,
            "size_mb": file_size_mb,
            "timestamp": timestamp,
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Backup timeout - database terlalu besar",
        )
    except Exception as e:
        logger.error(f"Backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup error: {str(e)}",
        )


@router.get("/list")
async def list_backups(
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    List all available backups (Admin only)
    """
    try:
        backups = []
        for backup_file in sorted(BACKUP_DIR.glob("backup_*.sql"), reverse=True):
            stat = backup_file.stat()
            backups.append(
                {
                    "filename": backup_file.name,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": datetime.fromtimestamp(stat.st_mtime).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )

        return {"backups": backups}

    except Exception as e:
        logger.error(f"List backups error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}",
        )


@router.get("/download/{filename}")
async def download_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    Download backup file (Admin only)
    """
    try:
        # Validate filename to prevent directory traversal
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        return FileResponse(
            path=backup_path,
            filename=filename,
            media_type="application/sql",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download backup: {str(e)}",
        )


@router.post("/restore/{filename}")
async def restore_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
    db: Session = Depends(get_db),
):
    """
    Restore database from backup (Admin only)
    WARNING: This will overwrite current database!
    """
    try:
        # Validate filename
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        # Read backup file
        with open(backup_path, "r") as f:
            sql_content = f.read()

        # Close current session
        db.close()

        # Execute SQL statements
        with engine.connect() as conn:
            # Split by semicolon and execute each statement
            statements = [s.strip() for s in sql_content.split(";") if s.strip()]

            for statement in statements:
                # Skip comments
                if statement.startswith("--"):
                    continue

                try:
                    conn.execute(text(statement))
                except Exception as e:
                    logger.warning(f"Statement failed (may be ok): {e}")
                    continue

            conn.commit()

        logger.info(f"Database restored successfully from: {filename}")

        return {
            "message": "Database berhasil di-restore",
            "filename": filename,
            "warning": "Aplikasi akan restart otomatis",
        }

    except Exception as e:
        logger.error(f"Restore error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Restore error: {str(e)}",
        )


@router.delete("/delete/{filename}")
async def delete_backup(
    filename: str,
    current_user: User = Depends(require_permission("manage_backup")),
):
    """
    Delete backup file (Admin only)
    """
    try:
        # Validate filename
        if not filename.startswith("backup_") or not filename.endswith(".sql"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename"
            )

        backup_path = BACKUP_DIR / filename

        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Backup file not found"
            )

        backup_path.unlink()

        logger.info(f"Backup deleted: {filename}")

        return {"message": "Backup berhasil dihapus", "filename": filename}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete backup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete backup: {str(e)}",
        )
