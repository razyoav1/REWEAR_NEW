-- =============================================================
-- REWEAR SEED DATA — safe to delete anytime
-- Seller UUID is fixed so you can easily remove all seed data:
--   DELETE FROM public.users WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
--   (listings will cascade-delete via seller_id FK)
-- =============================================================

-- 1. Seed auth user (needed for FK constraint)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'seed-seller@rewear.dev',
  '$2a$10$placeholder',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated', 'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed seller profile
INSERT INTO public.users (id, name, avatar_url, onboarding_completed, rating_avg, rating_count)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Seed Seller',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=rewear',
  true, 4.7, 23
) ON CONFLICT (id) DO NOTHING;

-- 3. Seed listings
INSERT INTO public.clothing_listings
  (seller_id, title, description, category, brand, size_system, size_value, condition, colors, price, currency, photos, status)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Vintage Levi''s 501 Jeans',
    'Classic straight-leg jeans in excellent condition. Barely worn, no fading.',
    'Bottoms', 'Levi''s', 'US', '32x30', 'like_new',
    ARRAY['Indigo Blue'],
    45.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800'],
    'available'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Oversized Graphic Tee',
    'Y2K aesthetic oversized tee. Washed multiple times, super soft.',
    'Tops', 'Vintage', 'US', 'L', 'good',
    ARRAY['White', 'Black'],
    18.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
    'available'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Nike Air Force 1 Low',
    'All white AF1s, worn twice. Size EU 42 / US 9.',
    'Shoes', 'Nike', 'EU', '42', 'like_new',
    ARRAY['White'],
    90.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800'],
    'available'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Zara Trench Coat',
    'Beige classic trench coat, size M. Perfect for autumn.',
    'Outerwear', 'Zara', 'EU', 'M', 'good',
    ARRAY['Beige'],
    60.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
    'available'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Silk Slip Dress',
    'Black satin slip dress, size S. Great for going out.',
    'Dresses', 'H&M', 'EU', 'S', 'like_new',
    ARRAY['Black'],
    32.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'],
    'available'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Adidas Originals Hoodie',
    'Grey classic hoodie, size L. Very comfortable, minimal wear.',
    'Tops', 'Adidas', 'EU', 'L', 'good',
    ARRAY['Grey'],
    38.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800'],
    'available'
  );
