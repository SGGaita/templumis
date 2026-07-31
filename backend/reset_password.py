"""
Reset password for a user account
"""
import sys
from app.auth import hash_password

# Generate the hashed password
email = "admin@templumis.ac"
new_password = "Waxmangme86"
hashed = hash_password(new_password)

print(f"Email: {email}")
print(f"New Password: {new_password}")
print(f"Hashed Password: {hashed}")
print("\nRun this SQL command to update:")
print(f"UPDATE users SET hashed_password = '{hashed}' WHERE email = '{email}';")
