from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base
import bcrypt
import json


class User(Base):
    """
    Model for user authentication and management.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default='viewer', nullable=False)  # 'superadmin', 'operator', 'viewer'
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)  # URL to user avatar image
    
    # Audit timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime, nullable=True)
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash."""
        return bcrypt.checkpw(password.encode('utf-8'), self.hashed_password.encode('utf-8'))
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class RolePermission(Base):
    """
    Model for role-based permissions.
    Stores which features each role can access.
    """
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role = Column(String(20), unique=True, nullable=False, index=True)  # 'operator', 'viewer'
    
    # Menu/Feature permissions (stored as JSON string)
    # Available permissions:
    # - dashboard: View dashboard
    # - upload: Upload data
    # - compare: Compare data
    # - archive: View archive
    # - download: Download Excel
    # - edit_status: Edit employee status (manual override)
    permissions = Column(Text, default='[]', nullable=False)
    
    # Audit timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def get_permissions(self):
        """Get permissions as list."""
        try:
            return json.loads(self.permissions) if self.permissions else []
        except:
            return []
    
    def set_permissions(self, perm_list):
        """Set permissions from list."""
        self.permissions = json.dumps(perm_list)
    
    def has_permission(self, permission):
        """Check if role has specific permission."""
        return permission in self.get_permissions()
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'role': self.role,
            'permissions': self.get_permissions(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LandingPageSettings(Base):
    """
    Model for landing page customization settings.
    """
    __tablename__ = "landing_page_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Text Content
    title = Column(String(100), default='Sistem Perbandingan Data Pegawai', nullable=False)
    subtitle = Column(String(200), default='Kelola dan bandingkan data pegawai dengan mudah', nullable=False)
    welcome_message = Column(String(500), default='Selamat datang di sistem perbandingan data pegawai', nullable=False)
    footer_text = Column(String(200), default='© 2024 Sistem Data Pegawai', nullable=False)
    
    # Image
    illustration_url = Column(String(500), nullable=True)
    image_width = Column(Integer, default=100, nullable=False)  # percentage
    image_height = Column(Integer, default=350, nullable=False)  # pixels
    
    # Sidebar settings
    sidebar_logo_url = Column(String(500), nullable=True)  # Logo for sidebar
    sidebar_title = Column(String(100), default='Data Pegawai', nullable=False)
    sidebar_tagline = Column(String(100), default='Sistem Perbandingan', nullable=False)
    
    # Colors
    background_color = Column(String(20), default='#667eea', nullable=False)
    card_background = Column(String(20), default='#ffffff', nullable=False)
    left_gradient_start = Column(String(20), default='#667eea', nullable=False)
    left_gradient_end = Column(String(20), default='#764ba2', nullable=False)
    primary_color = Column(String(20), default='#1e3a8a', nullable=False)
    button_color = Column(String(20), default='#667eea', nullable=False)  # Login button color
    button_text_color = Column(String(20), default='#ffffff', nullable=False)  # Login button text color
    
    # Typography
    title_size = Column(Integer, default=32, nullable=False)  # pixels
    subtitle_size = Column(Integer, default=16, nullable=False)  # pixels
    welcome_size = Column(Integer, default=14, nullable=False)  # pixels
    text_align = Column(String(10), default='center', nullable=False)  # left, center, right
    
    # Audit timestamps
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    def to_dict(self):
        """Convert model instance to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'subtitle': self.subtitle,
            'welcome_message': self.welcome_message,
            'footer_text': self.footer_text,
            'illustration_url': self.illustration_url,
            'image_width': self.image_width,
            'image_height': self.image_height,
            'background_color': self.background_color,
            'card_background': self.card_background,
            'left_gradient_start': self.left_gradient_start,
            'left_gradient_end': self.left_gradient_end,
            'primary_color': self.primary_color,
            'button_color': self.button_color,
            'button_text_color': self.button_text_color,
            'title_size': self.title_size,
            'subtitle_size': self.subtitle_size,
            'welcome_size': self.welcome_size,
            'text_align': self.text_align,
            'sidebar_logo_url': self.sidebar_logo_url,
            'sidebar_title': self.sidebar_title,
            'sidebar_tagline': self.sidebar_tagline,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
