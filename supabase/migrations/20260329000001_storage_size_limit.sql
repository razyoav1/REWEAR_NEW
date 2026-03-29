-- Enforce 5 MB file size limit on storage buckets
UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5 MB in bytes
WHERE id IN ('avatars', 'listing-photos');
