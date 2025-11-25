from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import LandingPageSettings, User
from app.routers.auth import get_current_active_user
import logging
import os
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/landing", tags=["landing"])

# Upload directory for landing page images
UPLOAD_DIR = Path("uploads/landing")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class LandingPageUpdate(BaseModel):
    title: str
    subtitle: str
    welcome_message: str
    footer_text: str
    image_width: int
    image_height: int
    background_color: str
    card_background: str
    left_gradient_start: str
    left_gradient_end: str
    primary_color: str
    button_color: str = "#667eea"
    button_text_color: str = "#ffffff"
    title_size: int
    subtitle_size: int
    welcome_size: int
    text_align: str
    sidebar_title: str = "Data Pegawai"
    sidebar_tagline: str = "Sistem Perbandingan"


@router.get("/settings")
async def get_landing_settings(db: Session = Depends(get_db)):
    """
    Get landing page settings (public endpoint).
    """
    try:
        settings = db.query(LandingPageSettings).first()
        
        # If no settings exist, create default
        if not settings:
            settings = LandingPageSettings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return {
            "status": "success",
            "settings": settings.to_dict()
        }
        
    except Exception as e:
        logger.error(f"Error getting landing settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/settings")
async def update_landing_settings(
    settings_data: LandingPageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update landing page settings (admin only).
    """
    try:
        # Check if user is superadmin
        if current_user.role != "superadmin":
            raise HTTPException(
                status_code=403,
                detail="Only Super Admin can update landing page settings"
            )
        
        # Get or create settings
        settings = db.query(LandingPageSettings).first()
        if not settings:
            settings = LandingPageSettings()
            db.add(settings)
        
        # Update settings
        settings.title = settings_data.title
        settings.subtitle = settings_data.subtitle
        settings.welcome_message = settings_data.welcome_message
        settings.footer_text = settings_data.footer_text
        settings.image_width = settings_data.image_width
        settings.image_height = settings_data.image_height
        settings.background_color = settings_data.background_color
        settings.card_background = settings_data.card_background
        settings.left_gradient_start = settings_data.left_gradient_start
        settings.left_gradient_end = settings_data.left_gradient_end
        settings.primary_color = settings_data.primary_color
        settings.button_color = settings_data.button_color
        settings.button_text_color = settings_data.button_text_color
        settings.title_size = settings_data.title_size
        settings.subtitle_size = settings_data.subtitle_size
        settings.welcome_size = settings_data.welcome_size
        settings.text_align = settings_data.text_align
        settings.sidebar_title = settings_data.sidebar_title
        settings.sidebar_tagline = settings_data.sidebar_tagline
        
        db.commit()
        db.refresh(settings)
        
        logger.info(f"Landing page settings updated by {current_user.username}")
        
        return {
            "status": "success",
            "message": "Landing page settings updated successfully",
            "settings": settings.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating landing settings: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload-illustration")
async def upload_illustration(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload illustration image for landing page (admin only).
    """
    try:
        # Check if user is superadmin
        if current_user.role != "superadmin":
            raise HTTPException(
                status_code=403,
                detail="Only Super Admin can upload landing page illustration"
            )
        
        # Validate file type
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        filename = f"landing_illustration{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update settings with new illustration URL
        settings = db.query(LandingPageSettings).first()
        if not settings:
            settings = LandingPageSettings()
            db.add(settings)
        
        # Use full URL for illustration
        settings.illustration_url = f"http://localhost:8000/uploads/landing/{filename}"
        db.commit()
        
        logger.info(f"Landing page illustration uploaded by {current_user.username}")
        
        return {
            "status": "success",
            "message": "Illustration uploaded successfully",
            "url": settings.illustration_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading illustration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/upload-sidebar-logo")
async def upload_sidebar_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload sidebar logo (Super Admin only).
    """
    try:
        if current_user.role != "superadmin":
            raise HTTPException(status_code=403, detail="Only Super Admin can upload sidebar logo")
        
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}")
        
        filename = f"sidebar_logo{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        settings = db.query(LandingPageSettings).first()
        if not settings:
            settings = LandingPageSettings()
            db.add(settings)
        
        settings.sidebar_logo_url = f"http://localhost:8000/uploads/landing/{filename}"
        db.commit()
        
        logger.info(f"Sidebar logo uploaded by {current_user.username}")
        
        return {"status": "success", "url": settings.sidebar_logo_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading sidebar logo: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/illustration")
async def delete_illustration(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete landing page illustration (admin only).
    """
    try:
        # Check if user is superadmin
        if current_user.role != "superadmin":
            raise HTTPException(
                status_code=403,
                detail="Only Super Admin can delete landing page illustration"
            )
        
        # Get settings
        settings = db.query(LandingPageSettings).first()
        if not settings or not settings.illustration_url:
            raise HTTPException(
                status_code=404,
                detail="No illustration found"
            )
        
        # Delete file if exists
        file_path = Path(settings.illustration_url.lstrip('/'))
        if file_path.exists():
            file_path.unlink()
        
        # Update settings
        settings.illustration_url = None
        db.commit()
        
        logger.info(f"Landing page illustration deleted by {current_user.username}")
        
        return {
            "status": "success",
            "message": "Illustration deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting illustration: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")
