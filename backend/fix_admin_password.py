"""
Fix admin password by properly updating the database
"""
import psycopg2
from app.auth import hash_password
import os

# Database connection
conn = psycopg2.connect(
    host="db",
    port=5432,
    database="templumis_db",
    user="templumis",
    password=os.getenv("POSTGRES_PASSWORD", "Waxmangme86")
)

cursor = conn.cursor()

# Generate proper hash
email = "admin@templumis.ac"
new_password = "Waxmangme86"
hashed = hash_password(new_password)

print(f"Updating password for: {email}")
print(f"New password: {new_password}")
print(f"Hash: {hashed}")

# Update using parameterized query to avoid escaping issues
cursor.execute(
    "UPDATE users SET hashed_password = %s WHERE email = %s",
    (hashed, email)
)

conn.commit()
rows_updated = cursor.rowcount

if rows_updated > 0:
    print(f"✅ Password updated successfully! ({rows_updated} row(s) affected)")
else:
    print("❌ No user found with that email")

cursor.close()
conn.close()
