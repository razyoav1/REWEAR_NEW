-- Clean up orphaned soft-deleted listings that should have been hard-deleted
DELETE FROM clothing_listings WHERE status = 'deleted' OR deleted_at IS NOT NULL;