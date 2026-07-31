# pgAdmin 4 Connection Guide for TemplumIS

## Overview
This guide explains how to connect to the TemplumIS PostgreSQL database running in Docker using pgAdmin 4.

## Important Notes

- **Port Conflict**: The Docker PostgreSQL runs on port **5434** (not the default 5432) to avoid conflicts with local PostgreSQL installations
- **Database Name**: The database is named `templumis_db`
- **Password**: Use the password from your `.env` file (currently: `Waxmangme86`)

## Connection Settings

### Step 1: Register New Server
1. Open pgAdmin 4
2. Right-click on **"Servers"** in the Object Explorer
3. Select **Register** → **Server**

### Step 2: General Tab
- **Name**: `TemplumIS Docker` (or any name you prefer)

### Step 3: Connection Tab
Fill in these exact values:

| Field | Value |
|-------|-------|
| **Host name/address** | `127.0.0.1` |
| **Port** | `5434` |
| **Maintenance database** | `templumis_db` |
| **Username** | `templumis` |
| **Password** | `Waxmangme86` (from `.env` file) |
| **Save password** | Toggle ON |

### Step 4: SSL Tab
- **SSL Mode**: `Disable`

### Step 5: Save
Click **Save** to create the connection.

## Accessing the Tables

Once connected, navigate through the Object Explorer:

```
TemplumIS Docker
└── Databases
    └── templumis_db
        └── Schemas
            └── public
                └── Tables (13 tables)
```

## Database Tables

The database contains 13 tables:

### Core Tables
- **institutions** - Multi-tenant institution management
- **institution_domains** - Domain mapping for institutions  
- **users** - Platform and institution-scoped users

### Dimension Tables
- **programs** - Academic programs
- **cohorts** - Student cohorts
- **funding_sources** - Funding source management

### Fact Tables
- **students** - Student enrollment data
- **scholarships** - Scholarship management
- **scholarship_applications** - Student scholarship applications
- **grants** - Research grants
- **grant_publications** - Grant-related publications
- **support_tickets** - Student support tickets

### System Tables
- **audit_log** - Audit trail for all actions

## Troubleshooting

### Cannot See Tables
1. Right-click on **Tables** and select **Refresh**
2. If still not visible, right-click on **public** schema and select **Refresh**
3. Close and reopen pgAdmin 4

### Connection Timeout
- Ensure Docker containers are running: `docker ps`
- Verify the database container is healthy
- Use `127.0.0.1` instead of `localhost`

### Password Authentication Failed
- Verify the password matches your `.env` file
- Check that you're using port `5434`, not `5432`
- Ensure you're connecting to `templumis_db` database

### Wrong PostgreSQL Server
If you have multiple PostgreSQL installations:
- Make sure you're connecting to port **5434** (Docker)
- Port **5432** is typically your local PostgreSQL installation

## Docker Commands

### Check Container Status
```powershell
docker ps --filter "name=templumis-db"
```

### View Database Logs
```powershell
docker logs templumis-db
```

### Connect via Command Line
```powershell
docker exec -it templumis-db psql -U templumis -d templumis_db
```

### Restart Containers
```powershell
cd c:\projects\templumIS
docker-compose restart
```

### Recreate Database (Fresh Start)
```powershell
cd c:\projects\templumIS
docker-compose down -v
docker-compose up -d
```

## Environment Configuration

The database configuration is stored in:
- **`.env`** - Your actual configuration (not in git)
- **`.env.example`** - Template with example values

Current configuration from `.env`:
```
POSTGRES_USER=templumis
POSTGRES_PASSWORD=Waxmangme86
POSTGRES_DB=templumis
POSTGRES_HOST=db
POSTGRES_PORT=5432  # Internal Docker port
```

External access port (from `docker-compose.yml`): **5434**

## Schema Location

The database schema is defined in:
```
c:\projects\templumIS\db\init\01-schema.sql
```

This file is automatically executed when the database container is first created.
