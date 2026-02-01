$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = "backup_unimed_db_$date.sql"
Write-Host "Starting backup..."
docker-compose exec -t db pg_dump -U unimed_user unimed_db > $filename
if ($?) {
    Write-Host "Backup created successfully: $filename"
} else {
    Write-Host "Backup failed."
}
