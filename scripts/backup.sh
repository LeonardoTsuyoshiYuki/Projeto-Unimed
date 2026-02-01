#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="backup_unimed_db_$DATE.sql"

echo "Starting backup..."
docker-compose exec -t db pg_dump -U unimed_user unimed_db > $FILENAME

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $FILENAME"
else
    echo "Backup failed."
fi
