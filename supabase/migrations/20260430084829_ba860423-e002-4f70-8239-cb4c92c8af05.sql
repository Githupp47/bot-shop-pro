
-- fix touch_updated_at search_path
create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

-- restrict EXECUTE on SECURITY DEFINER functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- has_role still needs to be callable from RLS policies; SECURITY DEFINER + revoke from roles is fine because RLS evaluates as the function owner. Grant back to authenticated for direct app use through RLS expressions.
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
