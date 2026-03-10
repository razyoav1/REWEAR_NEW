-- Migrate existing users with unsupported currencies to NIS
UPDATE public.users SET currency = 'NIS' WHERE currency IS NULL OR currency NOT IN ('USD', 'NIS');

-- Migrate existing users with unsupported languages to en
UPDATE public.users SET language = 'en' WHERE language IS NULL OR language NOT IN ('en', 'he');

-- Add check constraints for language and currency
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_language_check;
ALTER TABLE public.users ADD CONSTRAINT users_language_check CHECK (language IN ('en', 'he'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_currency_check;
ALTER TABLE public.users ADD CONSTRAINT users_currency_check CHECK (currency IN ('USD', 'NIS'));

-- Update default values for new users
ALTER TABLE public.users ALTER COLUMN language SET DEFAULT 'en';
ALTER TABLE public.users ALTER COLUMN currency SET DEFAULT 'NIS';