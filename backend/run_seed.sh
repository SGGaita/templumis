#!/bin/bash
# Run data seeding script inside Docker container

echo "Running data seeding script..."
docker exec -it templumis-backend python seed_data.py
