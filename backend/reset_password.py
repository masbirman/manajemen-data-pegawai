from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

user = db.query(User).filter(User.username == 'superadmin').first()
if user:
    user.hashed_password = pwd_context.hash('admin123')
    db.commit()
    print('Password reset to: admin123')
else:
    print('User not found')
db.close()
