-- =============================================================
-- REWEAR FICTIONAL USERS SEED — 5 users with listings, follows, reviews
-- All UUIDs start with bbbbbbbb- for easy cleanup:
--   DELETE FROM auth.users WHERE id LIKE 'bbbbbbbb%';
--   (everything cascades via FKs)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AUTH USERS (required for FK from public.users)
-- ─────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'maya.cohen@rewear.dev',   '$2a$10$placeholder', now(), now()-interval'45 days', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'jake.rivera@rewear.dev',   '$2a$10$placeholder', now(), now()-interval'38 days', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'sofia.park@rewear.dev',    '$2a$10$placeholder', now(), now()-interval'30 days', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'liam.torres@rewear.dev',   '$2a$10$placeholder', now(), now()-interval'22 days', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aria.chen@rewear.dev',     '$2a$10$placeholder', now(), now()-interval'14 days', now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. USER PROFILES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.users (id, name, avatar_url, onboarding_completed, rating_avg, rating_count, location_lat, location_lng, currency, created_at)
VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Maya Cohen',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=maya&backgroundColor=b6e3f4',
    true, 4.8, 12,
    32.0853, 34.7818, 'USD',
    now()-interval'45 days'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Jake Rivera',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jake&backgroundColor=ffdfbf',
    true, 4.5, 8,
    32.0640, 34.7740, 'USD',
    now()-interval'38 days'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Sofia Park',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia&backgroundColor=d1f0d1',
    true, 4.9, 5,
    32.1058, 34.8551, 'USD',
    now()-interval'30 days'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'Liam Torres',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=liam&backgroundColor=ffd5dc',
    true, 4.6, 17,
    32.7940, 34.9896, 'USD',
    now()-interval'22 days'
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'Aria Chen',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=aria&backgroundColor=c0aede',
    true, 5.0, 3,
    31.7683, 35.2137, 'USD',
    now()-interval'14 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. LISTINGS — Maya Cohen (fashion, lots of variety)
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.clothing_listings
  (seller_id, title, description, category, brand, size_system, size_value, condition, colors, price, currency, photos, status, location_lat, location_lng)
VALUES
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Floral Wrap Dress',
    'Beautiful midi wrap dress with floral print. Wore it to a wedding, fits true to size. Size S.',
    'Dresses', 'Zara', 'EU', 'S', 'like_new',
    ARRAY['Multicolor', 'Pink'],
    38.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800'],
    'available', 32.0853, 34.7818
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Linen Wide-Leg Trousers',
    'Off-white linen pants, super breathable for summer. High waist, size M.',
    'Bottoms', 'Mango', 'EU', 'M', 'good',
    ARRAY['White', 'Beige'],
    28.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4e26?w=800'],
    'available', 32.0853, 34.7818
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Knit Cardigan — Sage Green',
    'Cozy chunky knit cardigan. Oversized fit, size L. No pilling.',
    'Tops', 'H&M', 'EU', 'L', 'good',
    ARRAY['Green'],
    22.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'],
    'available', 32.0853, 34.7818
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'White Leather Sneakers',
    'Classic white leather sneakers, EU 38. Very clean, worn 3x.',
    'Shoes', 'Veja', 'EU', '38', 'like_new',
    ARRAY['White'],
    75.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800'],
    'available', 32.0853, 34.7818
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'Denim Mini Skirt',
    'Raw hem denim mini skirt, size XS. Very trendy right now.',
    'Bottoms', 'Topshop', 'UK', '6', 'good',
    ARRAY['Blue'],
    20.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1561861422-a549073e547a?w=800'],
    'sold', 32.0853, 34.7818
  ),

-- ─────────────────────────────────────────────────────────────
-- 4. LISTINGS — Jake Rivera (streetwear, sneakers, hoodies)
-- ─────────────────────────────────────────────────────────────
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Supreme Box Logo Hoodie FW22',
    'Navy Supreme BOGO hoodie, size L. Purchased from the drop, never worn. Tag still on.',
    'Tops', 'Supreme', 'US', 'L', 'new_with_tags',
    ARRAY['Navy'],
    320.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800'],
    'available', 32.0640, 34.7740
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Jordan 1 Retro High OG — Chicago',
    'Size EU 44 / US 10. DS, in original box. OG laces included.',
    'Shoes', 'Jordan', 'EU', '44', 'new_with_tags',
    ARRAY['Red', 'White', 'Black'],
    450.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
    'available', 32.0640, 34.7740
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Cargo Pants — Olive Green',
    'Y2K style cargo trousers. Size M. Great condition, no tears.',
    'Bottoms', 'Carhartt', 'US', 'M', 'good',
    ARRAY['Green'],
    55.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800'],
    'available', 32.0640, 34.7740
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Nike Tech Fleece Set',
    'Full matching Tech Fleece set (top + pants), size M. Black colorway.',
    'Activewear', 'Nike', 'EU', 'M', 'like_new',
    ARRAY['Black'],
    95.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
    'available', 32.0640, 34.7740
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Vintage Starter Jacket',
    '90s NFL starter jacket, large. Some wear on the sleeves but iconic piece.',
    'Outerwear', 'Starter', 'US', 'L', 'fair',
    ARRAY['Black', 'Red'],
    80.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
    'available', 32.0640, 34.7740
  ),

-- ─────────────────────────────────────────────────────────────
-- 5. LISTINGS — Sofia Park (minimalist, basics, quality pieces)
-- ─────────────────────────────────────────────────────────────
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Cream Oversized Blazer',
    'Structured oversized blazer in cream. Perfect layering piece. Size S/M.',
    'Outerwear', 'COS', 'EU', 'S', 'like_new',
    ARRAY['Beige', 'White'],
    68.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800'],
    'available', 32.1058, 34.8551
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Black Ribbed Turtleneck',
    'Classic slim-fit ribbed turtleneck. Size XS. Washed once, perfect condition.',
    'Tops', 'Uniqlo', 'JP', 'XS', 'like_new',
    ARRAY['Black'],
    18.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=800'],
    'available', 32.1058, 34.8551
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Wide Leg Tailored Trousers',
    'Charcoal grey wide-leg trousers. High waist, size S. Very flattering.',
    'Bottoms', 'Arket', 'EU', 'S', 'good',
    ARRAY['Grey'],
    45.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
    'available', 32.1058, 34.8551
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'Simple Leather Belt',
    'Genuine leather belt, cognac brown. Fits 70-80cm waist. Hardware: gold.',
    'Accessories', 'COS', 'EU', 'One Size', 'good',
    ARRAY['Brown'],
    15.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1573408301185-9519eb7f3a24?w=800'],
    'available', 32.1058, 34.8551
  ),

-- ─────────────────────────────────────────────────────────────
-- 6. LISTINGS — Liam Torres (vintage, thrifted, unique finds)
-- ─────────────────────────────────────────────────────────────
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    '70s Western Shirt',
    'Authentic 70s western snap shirt. Pearl buttons, embroidered yoke. Size M.',
    'Tops', 'Vintage', 'US', 'M', 'fair',
    ARRAY['Brown', 'Orange'],
    42.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800'],
    'available', 32.7940, 34.9896
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'Levi''s 550 Relaxed Jeans — 36x32',
    'True vintage Levi''s 550 in medium wash. Great fading, no holes. Size 36x32.',
    'Bottoms', 'Levi''s', 'US', '36x32', 'fair',
    ARRAY['Blue'],
    55.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800'],
    'available', 32.7940, 34.9896
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'Military Field Jacket',
    'US Army field jacket, 80s issue. Size L-R. All patches intact.',
    'Outerwear', 'Military', 'US', 'L', 'fair',
    ARRAY['Green'],
    88.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800'],
    'available', 32.7940, 34.9896
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'Reebok Club C 85 — EU 43',
    'Classic Reebok Club C in white/green. Size EU43. Deadstock from 2018.',
    'Shoes', 'Reebok', 'EU', '43', 'like_new',
    ARRAY['White', 'Green'],
    65.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800'],
    'available', 32.7940, 34.9896
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'Striped Rugby Shirt',
    'Vintage rugby-style shirt, navy/white. Size L. Made in France.',
    'Tops', 'Vintage', 'FR', 'L', 'good',
    ARRAY['Navy', 'White'],
    30.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
    'available', 32.7940, 34.9896
  ),

-- ─────────────────────────────────────────────────────────────
-- 7. LISTINGS — Aria Chen (luxury, high-end resale)
-- ─────────────────────────────────────────────────────────────
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'Gucci GG Canvas Tote',
    'Authentic Gucci GG canvas tote bag. Includes dustbag. Minor wear on handles.',
    'Accessories', 'Gucci', 'IT', 'One Size', 'good',
    ARRAY['Brown', 'Beige'],
    480.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
    'available', 31.7683, 35.2137
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'Prada Re-Edition 2000 Mini Bag',
    'Black nylon Prada Re-Edition 2000. Auth card included. Barely used.',
    'Accessories', 'Prada', 'IT', 'One Size', 'like_new',
    ARRAY['Black'],
    620.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
    'available', 31.7683, 35.2137
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'Acne Studios Oversized Scarf',
    'Iconic Acne Studios mohair scarf in dusty pink. Perfect condition.',
    'Accessories', 'Acne Studios', 'EU', 'One Size', 'like_new',
    ARRAY['Pink'],
    130.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800'],
    'available', 31.7683, 35.2137
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000005',
    'Toteme Silk Blouse — Ivory',
    'Toteme 100% silk blouse in ivory. Size S. Dry-cleaned after each wear.',
    'Tops', 'Toteme', 'EU', 'S', 'like_new',
    ARRAY['White', 'Beige'],
    195.00, 'USD',
    ARRAY['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
    'available', 31.7683, 35.2137
  );

-- ─────────────────────────────────────────────────────────────
-- 8. FOLLOWS (who follows who)
-- ─────────────────────────────────────────────────────────────
-- Maya follows Jake and Aria
-- Jake follows Liam and Sofia
-- Sofia follows Maya and Aria
-- Liam follows Jake and Maya
-- Aria follows Sofia and Liam
INSERT INTO public.follows (follower_id, following_id) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000005'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000003'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000005'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000003'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 9. REVIEWS (between users)
-- ─────────────────────────────────────────────────────────────
-- NOTE: reviews require a prior conversation (can_review check).
-- We bypass this by inserting directly and letting the trigger update ratings.
-- Temporarily disable the can_review constraint by using the service role in SQL editor.
INSERT INTO public.reviews (reviewer_id, reviewee_id, rating, text, created_at)
VALUES
  -- Maya reviewed Jake
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002',
   5, 'Super fast shipping and the hoodie was exactly as described. 10/10!', now()-interval'30 days'),
  -- Jake reviewed Maya
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001',
   5, 'Great seller, items packaged beautifully. Highly recommend!', now()-interval'28 days'),
  -- Sofia reviewed Liam
  ('bbbbbbbb-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000004',
   4, 'Vintage piece was authentic, slight smell on arrival but aired out fine.', now()-interval'20 days'),
  -- Liam reviewed Sofia
  ('bbbbbbbb-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000003',
   5, 'Immaculate condition, super responsive. Would buy again!', now()-interval'18 days'),
  -- Jake reviewed Liam
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000004',
   4, 'Good comms, nice piece. Wish photos showed the fading better.', now()-interval'15 days'),
  -- Aria reviewed Maya
  ('bbbbbbbb-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000001',
   5, 'Maya is an amazing seller. Dress was perfect. Instant buy again!', now()-interval'10 days'),
  -- Maya reviewed Aria
  ('bbbbbbbb-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000005',
   5, 'Luxury reseller who actually delivers. Bag is 100% authentic.', now()-interval'8 days'),
  -- Liam reviewed Jake
  ('bbbbbbbb-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000002',
   5, 'Got the cargo pants. Exactly as described. Fast & friendly!', now()-interval'5 days')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- The reviews trigger will automatically update rating_avg and
-- rating_count on each user. Ratings are set manually above
-- for the initial seed but will be overwritten by the trigger.
-- ─────────────────────────────────────────────────────────────
