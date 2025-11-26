from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.routers.auth import get_superadmin_user, get_current_active_user
from app.models.user import User
from app.models.app_settings import AppSettings
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/app-settings", tags=["app-settings"])


class SettingsUpdate(BaseModel):
    fontSize: Optional[str] = "100"
    sidebarWidth: Optional[str] = "normal"
    contentSpacing: Optional[str] = "normal"
    themeColor: Optional[str] = "blue"
    accentColor: Optional[str] = "blue"
    selectedFont: Optional[str] = "jakarta"
    darkMode: Optional[bool] = False


@router.get("/")
async def get_app_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get application settings (available to all authenticated users).
    """
    try:
        # Get UI settings
        ui_settings = (
            db.query(AppSettings).filter(AppSettings.key == "ui_settings").first()
        )

        if not ui_settings:
            # Return default settings
            default_settings = {
                "fontSize": "100",
                "sidebarWidth": "normal",
                "contentSpacing": "normal",
                "themeColor": "blue",
                "accentColor": "blue",
                "selectedFont": "jakarta",
                "darkMode": False,
            }
            return {"settings": default_settings}

        return {"settings": ui_settings.get_json_value()}

    except Exception as e:
        logger.error(f"Get settings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get settings",
        )


@router.put("/")
async def update_app_settings(
    settings: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Update application settings (Super Admin only).
    These settings will apply to all users.
    """
    try:
        # Find or create UI settings
        ui_settings = (
            db.query(AppSettings).filter(AppSettings.key == "ui_settings").first()
        )

        settings_dict = {
            "fontSize": settings.fontSize,
            "sidebarWidth": settings.sidebarWidth,
            "contentSpacing": settings.contentSpacing,
            "themeColor": settings.themeColor,
            "accentColor": settings.accentColor,
            "selectedFont": settings.selectedFont,
            "darkMode": settings.darkMode,
        }

        if not ui_settings:
            # Create new settings
            ui_settings = AppSettings(
                key="ui_settings",
                value=json.dumps(settings_dict),
                description="Global UI settings for all users",
            )
            db.add(ui_settings)
        else:
            # Update existing settings
            ui_settings.set_json_value(settings_dict)

        db.commit()
        db.refresh(ui_settings)

        logger.info(f"App settings updated by {current_user.username}")

        return {
            "status": "success",
            "message": "Settings updated successfully",
            "settings": ui_settings.get_json_value(),
        }

    except Exception as e:
        logger.error(f"Update settings error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings",
        )


@router.post("/reset")
async def reset_app_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user),
):
    """
    Reset application settings to default (Super Admin only).
    """
    try:
        ui_settings = (
            db.query(AppSettings).filter(AppSettings.key == "ui_settings").first()
        )

        default_settings = {
            "fontSize": "100",
            "sidebarWidth": "normal",
            "contentSpacing": "normal",
            "themeColor": "blue",
            "accentColor": "blue",
            "selectedFont": "jakarta",
            "darkMode": False,
        }

        if ui_settings:
            ui_settings.set_json_value(default_settings)
        else:
            ui_settings = AppSettings(
                key="ui_settings",
                value=json.dumps(default_settings),
                description="Global UI settings for all users",
            )
            db.add(ui_settings)

        db.commit()

        logger.info(f"App settings reset by {current_user.username}")

        return {
            "status": "success",
            "message": "Settings reset to default",
            "settings": default_settings,
        }

    except Exception as e:
        logger.error(f"Reset settings error: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset settings",
        )
