from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.routers.auth import get_superadmin_user, get_current_active_user
from app.models.user import User
from app.models.app_settings import AppSettings
import logging
import json
import os
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

UPLOAD_DIR = "uploads/maintenance"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class MaintenanceUpdate(BaseModel):
    enabled: bool = False
    title: Optional[str] = "Sedang Dalam Perbaikan"
    message: Optional[str] = "Sistem sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi."
    image_url: Optional[str] = None
    estimated_time: Optional[str] = None


@router.get("/status")
async def get_maintenance_status(db: Session = Depends(get_db)):
    """
    Get maintenance status (public endpoint - no auth required).
    """
    try:
        settings = (
            db.query(AppSettings).filter(AppSettings.key == "maintenance_mode").first()
        )

        if not settings:
            return {
                "enabled": False,
                "title": "Sedang Dalam Perbaikan",
                "message": "Sistem sedang dalam pemeliharaan.",
                "image_url": None,
                "estimated_time": None,
            }

        return settings.get_json_value()

    except Exception as e:
        logger.error(f"Get maintenance status error: {e}")
        return {"enabled": False}


@router.get("/settings")
async def get_maintenance_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Get maintenance settings (Super Admin only).
    """
    try:
        settings = (
            db.query(AppSettings).filter(AppSettings.key == "maintenance_mode").first()
        )

        if not settings:
            default = {
                "enabled": False,
                "title": "Sedang Dalam Perbaikan",
                "message": "Sistem sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.",
                "image_url": None,
                "estimated_time": None,
            }
            return {"settings": default}

        return {"settings": settings.get_json_value()}

    except Exception as e:
        logger.error(f"Get maintenance settings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get maintenance settings",
        )


@router.put("/settings")
async def update_maintenance_settings(
    settings: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Update maintenance settings (Super Admin only).
    """
    try:
        maintenance = (
            db.query(AppSettings).filter(AppSettings.key == "maintenance_mode").first()
        )

        settings_dict = {
            "enabled": settings.enabled,
            "title": settings.title,
            "message": settings.message,
            "image_url": settings.image_url,
            "estimated_time": settings.estimated_time,
            "updated_at": datetime.now().isoformat(),
            "updated_by": current_user.username,
        }

        if not maintenance:
            maintenance = AppSettings(
                key="maintenance_mode",
                value=json.dumps(settings_dict),
                description="Maintenance mode settings",
            )
            db.add(maintenance)
        else:
            maintenance.set_json_value(settings_dict)

        db.commit()
        db.refresh(maintenance)

        status_text = "diaktifkan" if settings.enabled else "dinonaktifkan"
        logger.info(f"Maintenance mode {status_text} by {current_user.username}")

        return {
            "status": "success",
            "message": f"Maintenance mode {status_text}",
            "settings": maintenance.get_json_value(),
        }

    except Exception as e:
        logger.error(f"Update maintenance settings error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update maintenance settings",
        )


@router.post("/upload-image")
async def upload_maintenance_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Upload maintenance page image (Super Admin only).
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed. Use JPEG, PNG, GIF, WebP, or SVG.",
            )

        # Generate unique filename
        ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        filename = f"maintenance_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        # Save file
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)

        # Return URL
        image_url = f"/uploads/maintenance/{filename}"

        logger.info(f"Maintenance image uploaded by {current_user.username}: {filename}")

        return {
            "status": "success",
            "message": "Image uploaded successfully",
            "image_url": image_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload maintenance image error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload image",
        )
