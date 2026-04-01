# TemplumIS Docker Commands Reference

## Essential Docker Commands

### Starting the Application

```bash
# Start all services (detached mode)
docker compose up -d

# Start all services with logs visible
docker compose up

# Start and rebuild all services
docker compose up --build

# Start and rebuild specific service
docker compose up --build backend
docker compose up --build frontend
```

### Stopping the Application

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v

# Stop specific service
docker compose stop backend
docker compose stop frontend
```

### Viewing Logs

```bash
# View logs for all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs backend
docker compose logs frontend
docker compose logs db
docker compose logs nginx

# View last 50 lines of logs
docker compose logs --tail 50 backend

# Follow logs for specific service
docker compose logs -f frontend
```

### Restarting Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

### Checking Service Status

```bash
# List running containers
docker compose ps

# View detailed container information
docker ps

# View all containers (including stopped)
docker ps -a
```

### Executing Commands in Containers

```bash
# Execute command in backend container
docker compose exec backend <command>

# Execute command in frontend container
docker compose exec frontend <command>

# Execute command in database container
docker compose exec db <command>

# Open bash shell in backend
docker compose exec backend bash

# Open bash shell in frontend
docker compose exec frontend sh
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker compose exec db psql -U templumis -d templumis_db

# Run SQL query directly
docker compose exec db psql -U templumis -d templumis_db -c "SELECT * FROM users;"

# View database enum types
docker compose exec db psql -U templumis -d templumis_db -c "\dT+ user_role"

# Backup database
docker compose exec db pg_dump -U templumis templumis_db > backup.sql

# Restore database
docker compose exec -T db psql -U templumis templumis_db < backup.sql
```

### Backend Management Commands

```bash
# Create Global Admin account
docker compose exec backend python manage.py create-global-admin --email admin@templumis.com --name "Global Admin" --password Admin123!

# Run Python shell in backend
docker compose exec backend python

# Check backend Python version
docker compose exec backend python --version

# Install new Python package (temporary, add to requirements.txt for persistence)
docker compose exec backend pip install <package-name>
```

### Frontend Operations

```bash
# View Next.js build output
docker compose logs frontend

# Clear Next.js cache (restart container)
docker compose restart frontend

# Install new npm package (temporary)
docker compose exec frontend npm install <package-name>
```

### Cleaning Up

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove all unused Docker resources (CAUTION)
docker system prune -a

# Clear Docker build cache
docker builder prune -af
```

### Rebuilding Services

```bash
# Rebuild all services without cache
docker compose build --no-cache

# Rebuild specific service without cache
docker compose build --no-cache backend
docker compose build --no-cache frontend

# Rebuild and start
docker compose up --build -d
```

### Monitoring Resources

```bash
# View resource usage for all containers
docker stats

# View resource usage for specific container
docker stats templumis-backend

# View container processes
docker compose top
```

### Network Operations

```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect templumis_default

# View container IP addresses
docker compose exec backend hostname -i
```

### Volume Operations

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect templumis_postgres_data

# Remove specific volume (WARNING: deletes data)
docker volume rm templumis_postgres_data
```

## Common Workflows

### Full Reset (Clean Start)

```bash
# Stop everything and remove volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Clear build cache
docker builder prune -af

# Start fresh
docker compose up --build -d

# Create Global Admin
docker compose exec backend python manage.py create-global-admin --email admin@templumis.com --name "Global Admin" --password Admin123!
```

### Update After Code Changes

```bash
# Backend changes (Python code)
docker compose restart backend

# Frontend changes (JavaScript/JSX)
# Usually auto-reloads, but if not:
docker compose restart frontend

# Database schema changes
docker compose down -v
docker compose up -d
docker compose exec backend python manage.py create-global-admin --email admin@templumis.com --name "Global Admin" --password Admin123!
```

### Debugging

```bash
# View backend logs in real-time
docker compose logs -f backend

# View frontend build errors
docker compose logs frontend --tail 100

# Check database connection
docker compose exec backend python -c "from app.database import engine; print(engine.url)"

# Test API endpoint
docker compose exec backend python -c "import requests; print(requests.get('http://localhost:8000/api/health').json())"
```

### Production Deployment

```bash
# Build for production
docker compose -f docker-compose.prod.yml build

# Start production services
docker compose -f docker-compose.prod.yml up -d

# View production logs
docker compose -f docker-compose.prod.yml logs -f
```

## Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432 (internal only)
- **Nginx**: http://localhost (port 80)

## Default Credentials

### Global Admin
- **Email**: admin@templumis.com
- **Password**: Admin123!

### Database
- **User**: templumis
- **Password**: templumis_password
- **Database**: templumis_db

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker compose logs <service-name>

# Remove and recreate
docker compose rm <service-name>
docker compose up -d <service-name>
```

### Database Connection Issues
```bash
# Restart database
docker compose restart db

# Check database logs
docker compose logs db

# Verify database is running
docker compose exec db pg_isready -U templumis
```

### Frontend Build Errors
```bash
# Clear Next.js cache
docker compose exec frontend rm -rf .next

# Rebuild frontend
docker compose up --build frontend
```
