/*
  # Google OAuth Support Migration
  
  - Adds a trigger to auto-create profile when user signs up via Google OAuth
  - Ensures username uniqueness for Google users
  - Adds google_id column to profiles
*/

-- Add google_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'google_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN google_id text UNIQUE;
  END IF;
END $$;

-- Function to auto-create profile on new user signup (handles Google OAuth)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  uname text;
  ucode text;
  counter integer := 0;
  base_username text;
BEGIN
  -- Only create profile if it doesn't already exist
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Generate base username from metadata or email
  base_username := COALESCE(
    regexp_replace(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9_]', '_', 'g'),
    split_part(NEW.email, '@', 1)
  );
  -- Limit to 20 chars
  base_username := left(base_username, 16);
  uname := base_username;

  -- Ensure unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = uname) LOOP
    counter := counter + 1;
    uname := base_username || counter::text;
  END LOOP;

  ucode := upper(left(NEW.id::text, 8));

  INSERT INTO public.profiles (
    id, username, email, avatar_url,
    referral_code, main_balance, winning_balance, bonus_balance
  ) VALUES (
    NEW.id,
    uname,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'avatar_url',
    ucode,
    1000,
    0,
    50
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Allow admin to view all profiles (fix for Google-authed admins)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
