-- Set Tel Aviv coordinates as default for listings without location
UPDATE clothing_listings
SET location_lat = 32.0853, location_lng = 34.7818
WHERE location_lat IS NULL OR location_lng IS NULL;