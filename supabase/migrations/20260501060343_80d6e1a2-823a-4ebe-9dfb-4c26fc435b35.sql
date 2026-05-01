CREATE OR REPLACE FUNCTION public.bootstrap_admin_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  is_allowed_admin boolean := false;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'is_admin', false, 'error', 'not_authenticated');
  END IF;

  INSERT INTO public.profiles (id, username, credits)
  VALUES (
    current_user_id,
    coalesce(nullif(split_part(current_email, '@', 1), ''), 'Admin'),
    0
  )
  ON CONFLICT (id) DO NOTHING;

  is_allowed_admin := current_email = 'sevencasado454545@gmail.com';

  IF is_allowed_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'is_admin', is_allowed_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin_account() TO authenticated;