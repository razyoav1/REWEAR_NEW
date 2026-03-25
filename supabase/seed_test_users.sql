-- ============================================================
-- REWEAR TEST DATA SEED SCRIPT
-- Run this in the Supabase SQL Editor (as service role / postgres)
-- Creates 8 fictitious users + ~40 listings for testing
-- ============================================================

-- ──────────────────────────────────────────
-- 1. Insert into auth.users (required first)
-- ──────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  is_sso_user, is_anonymous
) VALUES
  (
    'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'maya.chen@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Maya Chen"}',
    now() - interval '120 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'leo.nakamura@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Leo Nakamura"}',
    now() - interval '90 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sofia.ross@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Sofia Ross"}',
    now() - interval '75 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'jake.okafor@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Jake Okafor"}',
    now() - interval '60 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'zara.patel@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Zara Patel"}',
    now() - interval '45 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'tom.wade@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Tom Wade"}',
    now() - interval '30 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'nina.garcia@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Nina Garcia"}',
    now() - interval '20 days', now(), false, false
  ),
  (
    'a1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'alex.kim@rewear.test', crypt('testpass123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{"name":"Alex Kim"}',
    now() - interval '10 days', now(), false, false
  )
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 2. Insert public user profiles
-- ──────────────────────────────────────────
INSERT INTO public.users (
  id, name, bio, avatar_url,
  currency, location_lat, location_lng,
  default_radius_km, onboarding_completed,
  rating_avg, rating_count, account_status,
  last_seen_at, created_at, updated_at
) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Maya Chen',
    'Vintage lover 🌸 Minimalist wardrobe advocate. Ships fast!',
    'https://api.dicebear.com/7.x/personas/svg?seed=MayaChen',
    'USD', 40.7128, -74.0060, 25, true,
    4.8, 23, 'active',
    now() - interval '2 hours', now() - interval '120 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Leo Nakamura',
    'Streetwear head. Nike, Supreme, Off-White. Always looking for trades 🔄',
    'https://api.dicebear.com/7.x/personas/svg?seed=LeoNakamura',
    'USD', 34.0522, -118.2437, 30, true,
    4.6, 41, 'active',
    now() - interval '1 day', now() - interval '90 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Sofia Ross',
    'Thrift queen 👑 Y2K & early 2000s fashion obsessed. Reasonable on prices.',
    'https://api.dicebear.com/7.x/personas/svg?seed=SofiaRoss',
    'USD', 51.5074, -0.1278, 20, true,
    4.9, 67, 'active',
    now() - interval '3 hours', now() - interval '75 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Jake Okafor',
    'Designer reseller. Authenticating everything I sell. DM for offers 💬',
    'https://api.dicebear.com/7.x/personas/svg?seed=JakeOkafor',
    'USD', 41.8827, -87.6233, 40, true,
    4.7, 15, 'active',
    now() - interval '5 hours', now() - interval '60 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Zara Patel',
    'Slow fashion advocate 🌿 Mostly Zara, Mango & H&M gems. Bundle discounts!',
    'https://api.dicebear.com/7.x/personas/svg?seed=ZaraPatel',
    'USD', 48.8566, 2.3522, 35, true,
    4.5, 8, 'active',
    now() - interval '12 hours', now() - interval '45 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'Tom Wade',
    'Menswear & workwear. Suits, shirts, chinos. Everything dry-cleaned. 👔',
    'https://api.dicebear.com/7.x/personas/svg?seed=TomWade',
    'USD', 37.7749, -122.4194, 20, true,
    4.4, 12, 'active',
    now() - interval '2 days', now() - interval '30 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000007',
    'Nina Garcia',
    'Boho soul ✨ Flowing fabrics, earthy tones, festival fits. Mostly NWT.',
    'https://api.dicebear.com/7.x/personas/svg?seed=NinaGarcia',
    'USD', 25.7617, -80.1918, 30, true,
    4.9, 31, 'active',
    now() - interval '6 hours', now() - interval '20 days', now()
  ),
  (
    'a1000000-0000-0000-0000-000000000008',
    'Alex Kim',
    'K-fashion & techwear. Seoul-inspired fits 🇰🇷 International shipping.',
    'https://api.dicebear.com/7.x/personas/svg?seed=AlexKim',
    'USD', 47.6062, -122.3321, 25, true,
    4.3, 5, 'active',
    now() - interval '4 hours', now() - interval '10 days', now()
  )
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 3. Insert clothing listings
-- ──────────────────────────────────────────
INSERT INTO public.clothing_listings (
  id, seller_id, title, description,
  category, brand, size_value, size_system, condition,
  colors, price, currency, photos,
  location_lat, location_lng, status,
  tags, gender, price_flexible,
  created_at, updated_at
) VALUES

-- ── Maya Chen (vintage / women's) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001',
  'Levi''s 501 High Waist Jeans', 'Classic 501s in great condition. Slight fade which adds character. 90s wash. Hemmed to 28" inseam.',
  'bottoms', 'Levi''s', '27', 'US', 'good',
  ARRAY['blue'], 45.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'],
  40.7128, -74.0060, 'available',
  ARRAY['vintage', 'denim', '90s'], 'women', true,
  now() - interval '10 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001',
  'Ralph Lauren Polo Shirt (Vintage)', 'Authentic vintage RL polo from the early 2000s. Logo embroidery is perfect. Washed dozens of times, still vibrant.',
  'tops', 'Ralph Lauren', 'S', 'US', 'good',
  ARRAY['white'], 35.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600'],
  40.7128, -74.0060, 'available',
  ARRAY['vintage', 'preppy', 'polo'], 'women', false,
  now() - interval '8 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001',
  'Zara Satin Midi Skirt', 'Bought for a wedding, worn once. Dusty rose color, buttery satin. Falls to mid-calf. No stains, zipper works perfectly.',
  'skirts', 'Zara', 'XS', 'US', 'like_new',
  ARRAY['pink'], 28.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
  40.7128, -74.0060, 'available',
  ARRAY['formal', 'satin', 'midi'], 'women', true,
  now() - interval '5 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001',
  'Vintage Lace Slip Dress', 'Beautiful ivory lace overlay slip dress. Very Y2K energy. No snags or tears. Adjustable spaghetti straps.',
  'dresses', NULL, 'S', 'US', 'good',
  ARRAY['white', 'cream'], 38.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=600'],
  40.7128, -74.0060, 'available',
  ARRAY['vintage', 'y2k', 'lace', 'dress'], 'women', true,
  now() - interval '3 days', now()
),

-- ── Leo Nakamura (streetwear / men's) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002',
  'Nike Air Force 1 Shadow — Size 10', 'Worn 3 times. Original box included. No creases. Triple white. Clean soles.',
  'shoes', 'Nike', '10', 'US', 'like_new',
  ARRAY['white'], 110.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600'],
  34.0522, -118.2437, 'available',
  ARRAY['nike', 'sneakers', 'af1'], 'men', true,
  now() - interval '14 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002',
  'Supreme Box Logo Hoodie FW22', 'Authentic. Bought at drop. Worn twice, washed cold. No pilling. Tag still attached inside.',
  'tops', 'Supreme', 'L', 'US', 'like_new',
  ARRAY['black'], 320.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600'],
  34.0522, -118.2437, 'available',
  ARRAY['supreme', 'streetwear', 'hoodie', 'hype'], 'men', false,
  now() - interval '7 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002',
  'Carhartt WIP Michigan Jacket', 'Duck canvas chore coat. Sand colorway. Broken in perfectly — soft but structured. A few small scuffs on cuffs.',
  'outerwear', 'Carhartt WIP', 'M', 'US', 'good',
  ARRAY['beige', 'tan'], 95.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'],
  34.0522, -118.2437, 'available',
  ARRAY['carhartt', 'workwear', 'jacket'], 'men', true,
  now() - interval '4 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002',
  'Stüssy Crop Coach Jacket', 'Women''s stüssy crop jacket. Windbreaker material. Yellow with Stüssy script. Super rare colorway.',
  'outerwear', 'Stüssy', 'S', 'US', 'like_new',
  ARRAY['yellow'], 145.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600'],
  34.0522, -118.2437, 'available',
  ARRAY['stussy', 'streetwear', 'jacket', 'rare'], 'women', false,
  now() - interval '2 days', now()
),

-- ── Sofia Ross (Y2K / women's) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003',
  'Juicy Couture Velour Tracksuit Top', 'Iconic early 2000s Juicy velour zip hoodie in baby pink. Rhinestone logo. Small on the XS side of S.',
  'tops', 'Juicy Couture', 'S', 'US', 'good',
  ARRAY['pink'], 65.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600'],
  51.5074, -0.1278, 'available',
  ARRAY['y2k', 'juicy', 'velour', 'tracksuit'], 'women', true,
  now() - interval '20 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003',
  'Low Rise Flare Jeans', 'True Y2K low rise flare. Mid blue wash. Belt loops, no stretch, true vintage feel.',
  'bottoms', NULL, '26', 'US', 'good',
  ARRAY['blue'], 40.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'],
  51.5074, -0.1278, 'available',
  ARRAY['y2k', 'denim', 'flare', 'low-rise'], 'women', true,
  now() - interval '15 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003',
  'Butterfly Knit Top', 'Crochet butterfly knit crop top. Brown/neutral. One size. Super cute for summer or layering.',
  'tops', NULL, 'One Size', 'US', 'like_new',
  ARRAY['brown', 'beige'], 22.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1551163943-3f7fb13a0fa8?w=600'],
  51.5074, -0.1278, 'available',
  ARRAY['y2k', 'crochet', 'crop', 'summer'], 'women', false,
  now() - interval '9 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000003',
  'Platform Mary Jane Shoes', 'Black platform mary janes with chunky sole. Faux leather. Slight scuff on the toe of the right shoe.',
  'shoes', NULL, '7', 'US', 'fair',
  ARRAY['black'], 30.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'],
  51.5074, -0.1278, 'available',
  ARRAY['y2k', 'platform', 'mary-jane', 'grunge'], 'women', true,
  now() - interval '6 days', now()
),

-- ── Jake Okafor (designer / unisex) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004',
  'Gucci Monogram Belt (90cm)', 'Authentic Gucci GG belt with gold hardware. 90cm / fits waist 26-30". Minor scratches on buckle. Dust bag included.',
  'accessories', 'Gucci', '90cm', 'EU', 'good',
  ARRAY['brown', 'gold'],  180.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1624558652024-f04d89c60fa1?w=600'],
  41.8827, -87.6233, 'available',
  ARRAY['gucci', 'designer', 'belt', 'authentic'], 'unisex', false,
  now() - interval '18 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004',
  'Balenciaga Triple S — Size 43', 'Triple S in grey/green. Worn 5 times, light creasing at toe box. Receipt from Balenciaga NYC included.',
  'shoes', 'Balenciaga', '43', 'EU', 'like_new',
  ARRAY['grey', 'green'], 480.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'],
  41.8827, -87.6233, 'available',
  ARRAY['balenciaga', 'designer', 'sneakers', 'triple-s'], 'men', false,
  now() - interval '11 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000004',
  'Stone Island Patch Crewneck', 'Stone Island AW21 crewneck sweater. Ice cream colorway. Compass patch is perfect. Pilling-free.',
  'tops', 'Stone Island', 'L', 'EU', 'like_new',
  ARRAY['cream', 'white'], 220.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600'],
  41.8827, -87.6233, 'available',
  ARRAY['stone-island', 'designer', 'crewneck'], 'men', true,
  now() - interval '3 days', now()
),

-- ── Zara Patel (high-street / women's) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005',
  'H&M Conscious Linen Blazer', 'Structured linen blazer from H&M Conscious line. Natural linen color. Dry cleaned. No pills.',
  'outerwear', 'H&M', 'S', 'EU', 'like_new',
  ARRAY['beige', 'natural'], 25.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600'],
  48.8566, 2.3522, 'available',
  ARRAY['blazer', 'linen', 'sustainable'], 'women', true,
  now() - interval '16 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005',
  'Mango Leather Mini Skirt', 'Faux leather mini skirt from Mango. Black, A-line. Zipper on the back. Only worn twice.',
  'skirts', 'Mango', 'S', 'EU', 'like_new',
  ARRAY['black'], 20.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600'],
  48.8566, 2.3522, 'available',
  ARRAY['leather', 'mini-skirt', 'mango'], 'women', false,
  now() - interval '8 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000005',
  'Zara Ribbed Turtleneck Set', 'Matching ribbed turtleneck + shorts set in chocolate brown. Stretchy, cozy. New with tags.',
  'tops', 'Zara', 'M', 'EU', 'new_with_tags',
  ARRAY['brown'], 42.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1575316446735-0e9d95946367?w=600'],
  48.8566, 2.3522, 'available',
  ARRAY['zara', 'ribbed', 'set', 'turtleneck'], 'women', false,
  now() - interval '2 days', now()
),

-- ── Tom Wade (menswear) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000006',
  'Hugo Boss Slim Fit Suit (40R)', 'Charcoal grey 2-piece suit. Dry cleaned. Bought for job interview. Worn once. Slight pinstripe.',
  'outerwear', 'Hugo Boss', '40R', 'US', 'like_new',
  ARRAY['grey', 'charcoal'], 180.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600'],
  37.7749, -122.4194, 'available',
  ARRAY['suit', 'formal', 'menswear', 'hugo-boss'], 'men', true,
  now() - interval '25 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000006',
  'Brooks Brothers OCBD Shirt', 'Oxford cloth button-down in classic blue stripe. Size 15.5-34. Classic fit. Dry cleaned.',
  'tops', 'Brooks Brothers', 'M', 'US', 'good',
  ARRAY['blue', 'white'], 30.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'],
  37.7749, -122.4194, 'available',
  ARRAY['shirt', 'prep', 'menswear', 'oxford'], 'men', false,
  now() - interval '10 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000006',
  'Allen Edmonds Park Avenue Oxfords (10D)', 'Black cap-toe oxfords. Full grain leather. Resoled once by Allen Edmonds. Very minor scuffs.',
  'shoes', 'Allen Edmonds', '10', 'US', 'good',
  ARRAY['black'], 145.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'],
  37.7749, -122.4194, 'available',
  ARRAY['dress-shoes', 'oxfords', 'formal', 'menswear'], 'men', true,
  now() - interval '5 days', now()
),

-- ── Nina Garcia (boho / women's) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000007',
  'Free People Flowy Maxi Dress', 'Terracotta floral print maxi dress. Adjustable smocked bodice. Perfect for festivals or beach.',
  'dresses', 'Free People', 'S', 'US', 'like_new',
  ARRAY['orange', 'terracotta', 'floral'], 55.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600'],
  25.7617, -80.1918, 'available',
  ARRAY['boho', 'maxi', 'dress', 'festival'], 'women', true,
  now() - interval '12 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000007',
  'Anthropologie Linen Wide Leg Trousers', 'Off-white wide leg linen trousers. High waist, relaxed fit. Elastic at back waist. NWT.',
  'bottoms', 'Anthropologie', 'M', 'US', 'new_with_tags',
  ARRAY['white', 'cream'], 48.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1594938374174-5e73e0d6e3ef?w=600'],
  25.7617, -80.1918, 'available',
  ARRAY['boho', 'linen', 'wide-leg', 'trousers'], 'women', false,
  now() - interval '7 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000007',
  'Woven Straw Beach Bag', 'Large tote straw bag. Natural with leather handles. Zipper closure inside. Perfect summer accessory.',
  'accessories', NULL, 'One Size', 'US', 'good',
  ARRAY['natural', 'brown'], 18.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600'],
  25.7617, -80.1918, 'available',
  ARRAY['bag', 'straw', 'summer', 'beach'], 'women', true,
  now() - interval '4 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000007',
  'Crochet Cardigan (Hand-knit)', 'Cream crochet open-weave cardigan. Long length, bell sleeves. Hand knitted. True boho piece.',
  'tops', NULL, 'M', 'US', 'like_new',
  ARRAY['cream', 'white'], 62.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600'],
  25.7617, -80.1918, 'available',
  ARRAY['crochet', 'boho', 'cardigan', 'handmade'], 'women', true,
  now() - interval '1 day', now()
),

-- ── Alex Kim (K-fashion / techwear) ──
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000008',
  'Acronym J1A-GT Jacket', 'Genuine Acronym Gore-Tex paclite jacket. Used 4 times. All zips work. Minimal contact with outer shell.',
  'outerwear', 'Acronym', 'S', 'US', 'like_new',
  ARRAY['black'], 950.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600'],
  47.6062, -122.3321, 'available',
  ARRAY['techwear', 'acronym', 'gore-tex', 'jacket'], 'men', true,
  now() - interval '9 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000008',
  'CP Company Goggle Jacket (50)', 'Iconic CP Company urban protection jacket with goggle hood. Navy. Size 50 (EU M). No defects.',
  'outerwear', 'CP Company', '50', 'EU', 'good',
  ARRAY['navy', 'blue'], 380.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600'],
  47.6062, -122.3321, 'available',
  ARRAY['cp-company', 'goggle', 'jacket', 'designer'], 'men', true,
  now() - interval '6 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000008',
  'Wooyoungmi Wide Trousers', 'Korean designer Wooyoungmi wool blend wide leg trousers. Charcoal. EU 46 (fits M-L). Dry cleaned.',
  'bottoms', 'Wooyoungmi', '46', 'EU', 'like_new',
  ARRAY['grey', 'charcoal'], 195.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1594938374174-5e73e0d6e3ef?w=600'],
  47.6062, -122.3321, 'available',
  ARRAY['k-fashion', 'designer', 'trousers', 'wooyoungmi'], 'men', false,
  now() - interval '3 days', now()
),
(
  gen_random_uuid(), 'a1000000-0000-0000-0000-000000000008',
  'Adidas x Hyke Track Jacket (W)', 'Women''s Adidas x Hyke collab track jacket. White/navy. Size S. Collab from 2022. Great condition.',
  'outerwear', 'Adidas', 'S', 'US', 'like_new',
  ARRAY['white', 'navy'], 90.00, 'USD',
  ARRAY['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=600'],
  47.6062, -122.3321, 'available',
  ARRAY['adidas', 'collab', 'track-jacket', 'k-fashion'], 'women', false,
  now() - interval '1 day', now()
)

ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────
-- 4. Add some follows between users
-- ──────────────────────────────────────────
INSERT INTO public.follows (follower_id, following_id, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', now() - interval '4 days'),
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', now() - interval '3 days'),
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', now() - interval '2 days'),
  ('a1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────
-- 5. Add some reviews
-- ──────────────────────────────────────────
INSERT INTO public.reviews (reviewer_id, reviewee_id, rating, text, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 5, 'Super fast shipping! Item exactly as described. Would buy again.', now() - interval '14 days'),
  ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 5, 'Love the vintage finds. Packaged so carefully. 10/10 seller.', now() - interval '10 days'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 4, 'Authentic as described. Shipping took a few days but item is perfect.', now() - interval '8 days'),
  ('a1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 5, 'Best Y2K seller on here. She knows her stuff!', now() - interval '6 days'),
  ('a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 5, 'Beautiful items, perfect for my boho wardrobe. Very communicative.', now() - interval '4 days')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Seed complete: 8 users + 32 listings inserted' AS result;
