#!/usr/bin/env python3
import psycopg2
import bcrypt

# Connect to database
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="pegawai_db",
    user="user",
    password="password"
)

cur = conn.cursor()

# Hash password
password = "admin123"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# Update admin password
cur.execute("UPDATE users SET hashed_password = %s WHERE username = 'admin';", (hashed,))

# Create superadmin user if not exists
superadmin_password = "superadmin123"
superadmin_hash = bcrypt.hashpw(superadmin_password.encode('utf-8'), salt).decode('utf-8')

cur.execute("""
    INSERT INTO users (username, hashed_password, email, full_name, role, is_active)
    VALUES ('superadmin', %s, 'superadmin@example.com', 'Super Admin', 'superadmin', true)
    ON CONFLICT (username) DO UPDATE SET hashed_password = EXCLUDED.hashed_password;
""", (superadmin_hash,))

conn.commit()
cur.close()
conn.close()

print("✅ Password reset berhasil!")
print("Login dengan:")
print("  Username: admin")
print("  Password: admin123")
print("ATAU")
print("  Username: superadmin")
print("  Password: superadmin123")
