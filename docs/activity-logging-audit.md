# Activity Logging & Audit System - Status Report

## Overview
The TemplumIS platform has a comprehensive activity logging system that tracks all administrative actions across the system. All logs are persisted to the `audit_log` table in the PostgreSQL database.

## Database Schema

### Table: `audit_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key, auto-increment |
| `institution_id` | INTEGER | Foreign key to institutions (nullable) |
| `user_id` | INTEGER | Foreign key to users (nullable) |
| `action` | VARCHAR(100) | Action type identifier |
| `entity_type` | VARCHAR(100) | Type of entity affected |
| `entity_id` | INTEGER | ID of the affected entity |
| `details` | JSONB | Additional details in JSON format |
| `ip_address` | VARCHAR(45) | Client IP address (currently not captured) |
| `created_at` | TIMESTAMP | Timestamp of the action |

### Indexes
- Primary key on `id`
- Index on `institution_id` (for institution-scoped queries)
- Index on `user_id` (for user activity tracking)
- Index on `created_at` (for time-based queries)

### Foreign Key Constraints
- `institution_id` → `institutions(id)` ON DELETE SET NULL
- `user_id` → `users(id)` ON DELETE SET NULL

## Logged Actions by Module

### 1. Global Admin Module (`/api/global-admin`)

#### Institution Management
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /institutions` | `create_institution` | `institution` | name, slug |
| `PATCH /institutions/{id}` | `update_institution` | `institution` | All updated fields |
| `POST /institutions/{id}/deactivate` | `deactivate_institution` | `institution` | name |
| `POST /institutions/{id}/activate` | `activate_institution` | `institution` | name |
| `DELETE /institutions/{id}` | `delete_institution` | `institution` | name, slug |

#### Domain Management
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /institutions/{id}/domains` | `add_domain` | `institution_domain` | domain |
| `DELETE /institutions/{id}/domains/{domain_id}` | `remove_domain` | `institution_domain` | domain |

#### Admin User Management
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /institutions/{id}/admins` | `create_institution_admin` | `user` | email, institution_id |

### 2. Institution Admin Module (`/api/institution`)

#### Institution Profile
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `PATCH /profile` | `update_institution_profile` | `institution` | All updated fields |

#### Domain Management
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /domains` | `add_domain` | `institution_domain` | domain |
| `PATCH /domains/{id}` | `update_domain` | `institution_domain` | All updated fields |
| `DELETE /domains/{id}` | `remove_domain` | `institution_domain` | domain |

#### User Management
| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /users` | `create_user` | `user` | email, role |
| `PATCH /users/{id}` | `update_user` | `user` | All updated fields |
| `PATCH /users/{id}/deactivate` | `deactivate_user` | `user` | - |
| `PATCH /users/{id}/activate` | `activate_user` | `user` | - |
| `DELETE /users/{id}` | `delete_user` | `user` | email, full_name |

### 3. Authentication Module (`/api/auth`)

| Endpoint | Action | Entity Type | Details Captured |
|----------|--------|-------------|------------------|
| `POST /signup` | `user_signup` | `user` | email, role |

## Activity Log Retrieval Endpoints

### Global Admin Activity Log
**Endpoint:** `GET /api/global-admin/activity-log`

**Query Parameters:**
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Number of records (default: 50)
- `action` (string): Filter by action type (optional)

**Response:**
```json
{
  "total": 100,
  "items": [
    {
      "id": 1,
      "action": "create_institution",
      "entity_type": "institution",
      "entity_id": 5,
      "details": {"name": "Harvard University", "slug": "harvard"},
      "created_at": "2026-04-01T15:30:00",
      "user": {
        "id": 1,
        "full_name": "Admin User",
        "email": "admin@templumis.com"
      }
    }
  ]
}
```

### Institution-Specific Activity Log
**Endpoint:** `GET /api/institution/activity-log`

**Query Parameters:**
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Number of records (default: 50)
- `action` (string): Filter by action type (optional)

**Scope:** Only returns activities for the current admin's institution

### Institution Activities (for Global Admin)
**Endpoint:** `GET /api/global-admin/institutions/{id}/activities`

**Query Parameters:**
- `limit` (int): Number of records (default: 10)

**Scope:** Returns activities related to a specific institution (institution actions, domain actions, admin creation)

## Implementation Details

### How Logging Works

1. **Manual Logging**: Each endpoint that performs a state-changing operation manually creates an `AuditLog` entry
2. **Database Transaction**: Logs are added to the same database transaction as the main operation
3. **Atomic Operations**: If the main operation fails, the log entry is also rolled back

### Example Implementation

```python
# Create institution
institution = Institution(name=data.name, slug=data.slug)
db.add(institution)
db.flush()  # Get the institution.id

# Log the action
db.add(AuditLog(
    user_id=current_user.id,
    action="create_institution",
    entity_type="institution",
    entity_id=institution.id,
    details={"name": data.name, "slug": data.slug},
))

db.commit()  # Commit both institution and log
```

## Current Status

### ✅ Working Features
- [x] All CRUD operations are logged
- [x] User information is captured (user_id)
- [x] Institution context is captured (institution_id)
- [x] Action details are stored in JSONB format
- [x] Timestamps are automatically recorded
- [x] Foreign key relationships maintain data integrity
- [x] Indexes optimize query performance
- [x] Activity retrieval endpoints are functional
- [x] Pagination support for large datasets
- [x] Action filtering capability

### ⚠️ Missing Features
- [ ] **IP Address Capture**: The `ip_address` field exists but is not populated
  - Requires adding `Request` dependency to all logged endpoints
  - Would need to extract client IP from request headers
  
- [ ] **Login/Logout Logging**: Authentication events are not currently logged
  - Only signup is logged
  - Login attempts (success/failure) should be tracked
  
- [ ] **Read Operation Logging**: Only write operations are logged
  - Consider logging sensitive data access (e.g., viewing user lists)
  
- [ ] **Bulk Operation Logging**: No special handling for bulk operations
  
- [ ] **Log Retention Policy**: No automatic cleanup of old logs

## Verification Steps

### Check if Logging is Working

1. **View total log count:**
```sql
SELECT COUNT(*) FROM audit_log;
```

2. **View recent activities:**
```sql
SELECT 
    al.action,
    al.entity_type,
    al.created_at,
    u.email as user_email,
    i.name as institution_name
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN institutions i ON al.institution_id = i.id
ORDER BY al.created_at DESC
LIMIT 10;
```

3. **View activities by action type:**
```sql
SELECT action, COUNT(*) as count
FROM audit_log
GROUP BY action
ORDER BY count DESC;
```

4. **View activities for a specific user:**
```sql
SELECT 
    action,
    entity_type,
    details,
    created_at
FROM audit_log
WHERE user_id = 1
ORDER BY created_at DESC;
```

5. **View activities for a specific institution:**
```sql
SELECT 
    action,
    entity_type,
    details,
    created_at,
    u.email as performed_by
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
WHERE institution_id = 1
ORDER BY created_at DESC;
```

## Testing the System

### Manual Test Procedure

1. **Login as Global Admin**
   - Navigate to `http://localhost/global-admin/login`
   - Login with credentials

2. **Create an Institution**
   - Go to Institutions page
   - Click "Add Institution"
   - Fill in details and submit

3. **Check the Database**
```sql
SELECT * FROM audit_log WHERE action = 'create_institution' ORDER BY created_at DESC LIMIT 1;
```

Expected result: One log entry with action `create_institution`

4. **Add a Domain**
   - Click on the institution
   - Add a domain
   - Check database again

5. **Create an Admin**
   - Create an institution admin
   - Verify log entry exists

### Automated Testing (Future)

Consider adding integration tests:
```python
def test_institution_creation_logs_activity():
    # Create institution via API
    response = client.post("/api/global-admin/institutions", ...)
    
    # Query audit log
    log = db.query(AuditLog).filter(
        AuditLog.action == "create_institution"
    ).first()
    
    assert log is not None
    assert log.entity_type == "institution"
    assert log.details["name"] == "Test University"
```

## Recommendations

### High Priority
1. **Add IP Address Capture**
   - Modify all logged endpoints to accept `Request` object
   - Extract IP from `request.client.host` or `X-Forwarded-For` header
   
2. **Log Authentication Events**
   - Track login attempts (success and failure)
   - Track logout events
   - Track password changes

### Medium Priority
3. **Add Log Retention Policy**
   - Implement automatic archival of logs older than X months
   - Consider separate archive table or external storage

4. **Add Bulk Operation Support**
   - When multiple records are affected, log appropriately
   - Consider summary logs for bulk operations

### Low Priority
5. **Add Read Operation Logging** (optional)
   - Log access to sensitive data
   - May create high volume of logs

6. **Add Dashboard Metrics**
   - Activity timeline charts
   - Most active users
   - Action type distribution

## Conclusion

The activity logging system is **fully functional and working** for all state-changing operations. All administrative actions are being tracked and persisted to the database. The system provides comprehensive audit trails for compliance and debugging purposes.

The main enhancement needed is IP address capture, which would require adding the `Request` dependency to all logged endpoints. All other core functionality is operational and ready for production use.
