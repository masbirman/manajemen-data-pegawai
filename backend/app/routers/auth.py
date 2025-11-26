from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, List
from app.database import get_db
from app.models.user import User, RolePermission
import logging
import os
import shutil
from pathlib import Path

# Upload directory for avatars
AVATAR_UPLOAD_DIR = Path("uploads/avatars")
AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # TODO: Move to environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "viewer"  # 'operator' or 'viewer'


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PermissionUpdate(BaseModel):
    role: str
    permissions: List[str]


class UserLogin(BaseModel):
    username: str
    password: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user from token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Ensure user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_superadmin_user(current_user: User = Depends(get_current_active_user)):
    """Ensure user is superadmin."""
    if current_user.role != 'superadmin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin can perform this action"
        )
    return current_user


@router.post("/login", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """
    Login endpoint - authenticate user and return JWT token.
    """
    try:
        # Find user by username
        user = db.query(User).filter(User.username == username).first()
        
        if not user or not user.verify_password(password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires
        )
        
        logger.info(f"User {user.username} logged in successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register")
async def register(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """
    Register new user (Super Admin only).
    """
    try:
        # Validate role
        if user_data.role not in ['operator', 'viewer']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'operator' or 'viewer'"
            )
        
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        if user_data.email:
            existing_email = db.query(User).filter(User.email == user_data.email).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Create new user
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=User.hash_password(user_data.password),
            role=user_data.role,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New user registered by {current_user.username}: {new_user.username}")
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "user": new_user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information.
    """
    return current_user.to_dict()


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout endpoint (client should discard token).
    """
    logger.info(f"User {current_user.username} logged out")
    return {"status": "success", "message": "Logged out successfully"}


# ==================== USER MANAGEMENT (Super Admin Only) ====================

@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Get all users (Super Admin only)."""
    users = db.query(User).filter(User.role != 'superadmin').all()
    return {"users": [u.to_dict() for u in users]}


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Get user by ID (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.to_dict()


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Update user (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == 'superadmin':
        raise HTTPException(status_code=403, detail="Cannot modify Super Admin")
    
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.role is not None:
        if user_data.role not in ['operator', 'viewer']:
            raise HTTPException(status_code=400, detail="Role must be 'operator' or 'viewer'")
        user.role = user_data.role
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"User {user.username} updated by {current_user.username}")
    return {"status": "success", "user": user.to_dict()}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Delete user (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == 'superadmin':
        raise HTTPException(status_code=403, detail="Cannot delete Super Admin")
    
    username = user.username
    db.delete(user)
    db.commit()
    
    logger.info(f"User {username} deleted by {current_user.username}")
    return {"status": "success", "message": f"User {username} deleted"}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Reset user password (Super Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == 'superadmin':
        raise HTTPException(status_code=403, detail="Cannot reset Super Admin password here")
    
    user.hashed_password = User.hash_password(password_data.new_password)
    db.commit()
    
    logger.info(f"Password reset for {user.username} by {current_user.username}")
    return {"status": "success", "message": f"Password reset for {user.username}"}


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user's password."""
    # Verify current password
    if not User.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = User.hash_password(password_data.new_password)
    db.commit()
    
    logger.info(f"Password changed for user {current_user.username}")
    return {"status": "success", "message": "Password changed successfully"}


# ==================== PERMISSION MANAGEMENT (Super Admin Only) ====================

AVAILABLE_PERMISSIONS = [
    'dashboard',      # View dashboard
    'upload',         # Upload data
    'compare',        # Compare data
    'archive',        # View archive
    'download',       # Download Excel
    'edit_status',    # Edit employee status (manual override)
]


@router.get("/permissions")
async def get_all_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Get all role permissions (Super Admin only)."""
    permissions = db.query(RolePermission).all()
    return {
        "available_permissions": AVAILABLE_PERMISSIONS,
        "role_permissions": [p.to_dict() for p in permissions]
    }


@router.get("/permissions/{role}")
async def get_role_permissions(
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get permissions for a specific role."""
    if role == 'superadmin':
        return {"role": "superadmin", "permissions": AVAILABLE_PERMISSIONS}
    
    perm = db.query(RolePermission).filter(RolePermission.role == role).first()
    if not perm:
        return {"role": role, "permissions": []}
    return perm.to_dict()


@router.put("/permissions")
async def update_role_permissions(
    perm_data: PermissionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Update permissions for a role (Super Admin only)."""
    if perm_data.role not in ['operator', 'viewer']:
        raise HTTPException(status_code=400, detail="Role must be 'operator' or 'viewer'")
    
    # Validate permissions
    invalid_perms = [p for p in perm_data.permissions if p not in AVAILABLE_PERMISSIONS]
    if invalid_perms:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid permissions: {invalid_perms}. Available: {AVAILABLE_PERMISSIONS}"
        )
    
    # Find or create permission record
    perm = db.query(RolePermission).filter(RolePermission.role == perm_data.role).first()
    if not perm:
        perm = RolePermission(role=perm_data.role)
        db.add(perm)
    
    perm.set_permissions(perm_data.permissions)
    db.commit()
    db.refresh(perm)
    
    logger.info(f"Permissions updated for {perm_data.role} by {current_user.username}")
    return {"status": "success", "permissions": perm.to_dict()}


@router.post("/init-superadmin")
async def init_superadmin(db: Session = Depends(get_db)):
    """
    Initialize default Super Admin user (only if no superadmin exists).
    """
    try:
        # Check if superadmin already exists
        superadmin = db.query(User).filter(User.role == 'superadmin').first()
        if superadmin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Super Admin already exists"
            )
        
        # Create default superadmin
        admin_user = User(
            username="superadmin",
            email="superadmin@example.com",
            full_name="Super Administrator",
            hashed_password=User.hash_password("superadmin123"),
            role="superadmin",
            is_active=True
        )
        
        db.add(admin_user)
        
        # Create default permissions for operator and viewer
        operator_perm = RolePermission(role='operator')
        operator_perm.set_permissions(['dashboard', 'upload', 'compare', 'archive', 'download', 'edit_status'])
        db.add(operator_perm)
        
        viewer_perm = RolePermission(role='viewer')
        viewer_perm.set_permissions(['dashboard', 'archive', 'download'])
        db.add(viewer_perm)
        
        db.commit()
        
        logger.info("Super Admin and default permissions created")
        
        return {
            "status": "success",
            "message": "Super Admin created with default permissions",
            "username": "superadmin",
            "password": "superadmin123",
            "note": "Please change the password immediately!",
            "default_permissions": {
                "operator": ['dashboard', 'upload', 'compare', 'archive', 'download', 'edit_status'],
                "viewer": ['dashboard', 'archive', 'download']
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Init superadmin error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== AVATAR MANAGEMENT (Super Admin Only) ====================

@router.post("/users/{user_id}/avatar")
async def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Upload avatar for a user (Super Admin only)."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate file type
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.webp']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique filename
        filename = f"avatar_{user_id}{file_ext}"
        file_path = AVATAR_UPLOAD_DIR / filename
        
        # Delete old avatar if exists
        if user.avatar_url:
            old_filename = user.avatar_url.split('/')[-1]
            old_path = AVATAR_UPLOAD_DIR / old_filename
            if old_path.exists():
                old_path.unlink()
        
        # Save new file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user avatar URL
        user.avatar_url = f"http://localhost:8000/uploads/avatars/{filename}"
        db.commit()
        db.refresh(user)
        
        logger.info(f"Avatar uploaded for {user.username} by {current_user.username}")
        
        return {
            "status": "success",
            "message": "Avatar uploaded successfully",
            "avatar_url": user.avatar_url,
            "user": user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/users/{user_id}/avatar")
async def delete_user_avatar(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin_user)
):
    """Delete avatar for a user (Super Admin only)."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.avatar_url:
            raise HTTPException(status_code=404, detail="No avatar found")
        
        # Delete file
        filename = user.avatar_url.split('/')[-1]
        file_path = AVATAR_UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()
        
        # Clear avatar URL
        user.avatar_url = None
        db.commit()
        
        logger.info(f"Avatar deleted for {user.username} by {current_user.username}")
        
        return {"status": "success", "message": "Avatar deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar delete error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
