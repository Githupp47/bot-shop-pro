
-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'customer');
create type public.integration_provider as enum ('shopify','woocommerce','lazada','shopee','line_oa','messenger','instagram','web_widget');
create type public.integration_status as enum ('connected','disconnected','error');
create type public.bot_feature_key as enum (
  'sales_search','sales_recommend','sales_crosssell','sales_bundle','sales_dynamic_pricing',
  'cs_chat_24_7','cs_order_check','cs_tracking','cs_faq','cs_multilang',
  'ops_stock','ops_process_order','ops_warranty','ops_reorder','ops_fraud',
  'mkt_segment','mkt_promo','mkt_cart_recovery','mkt_churn','mkt_ads_audience'
);
create type public.conversation_status as enum ('active','resolved','human_takeover');
create type public.lead_tag as enum ('hot','warm','cold');
create type public.subscription_plan as enum ('free','starter','growth','enterprise');
create type public.subscription_status as enum ('active','past_due','canceled','trialing');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  avatar_url text,
  locale text not null default 'th',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- ============ INTEGRATIONS ============
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider public.integration_provider not null,
  status public.integration_status not null default 'disconnected',
  store_name text,
  config jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);
alter table public.integrations enable row level security;

-- ============ BOT FEATURES ============
create table public.bot_features (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key public.bot_feature_key not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, feature_key)
);
alter table public.bot_features enable row level security;

-- ============ TRAINING DOCS ============
create table public.training_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null, -- 'pdf','excel','faq','url','tone','promo'
  title text not null,
  content text,
  url text,
  status text not null default 'ready',
  created_at timestamptz not null default now()
);
alter table public.training_documents enable row level security;

-- ============ CONVERSATIONS / MESSAGES ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_avatar text,
  channel public.integration_provider not null,
  status public.conversation_status not null default 'active',
  lead_tag public.lead_tag,
  last_message text,
  last_message_at timestamptz not null default now(),
  unread_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('customer','ai','human')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number text not null,
  customer_name text not null,
  product_name text not null,
  amount numeric(12,2) not null,
  closed_by_ai boolean not null default true,
  channel public.integration_provider,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

-- ============ DAILY METRICS ============
create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null,
  revenue numeric(12,2) not null default 0,
  ai_revenue numeric(12,2) not null default 0,
  chats_count int not null default 0,
  orders_count int not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  new_customers int not null default 0,
  returning_customers int not null default 0,
  avg_response_seconds int not null default 0,
  csat numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, metric_date)
);
alter table public.daily_metrics enable row level security;

-- ============ SUBSCRIPTIONS ============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  amount numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  amount numeric(10,2) not null,
  status text not null default 'paid',
  pdf_url text,
  created_at timestamptz not null default now()
);
alter table public.invoices enable row level security;

-- ============ RLS POLICIES ============
-- profiles
create policy "users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "admins view all profiles" on public.profiles for select using (public.has_role(auth.uid(),'admin'));
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "admins view all roles" on public.user_roles for select using (public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(),'admin'));

-- generic owner policies
create policy "own integrations" on public.integrations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view integrations" on public.integrations for select using (public.has_role(auth.uid(),'admin'));

create policy "own bot_features" on public.bot_features for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own training" on public.training_documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view orders" on public.orders for select using (public.has_role(auth.uid(),'admin'));
create policy "own metrics" on public.daily_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view metrics" on public.daily_metrics for select using (public.has_role(auth.uid(),'admin'));
create policy "own subscription" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin view subscriptions" on public.subscriptions for select using (public.has_role(auth.uid(),'admin'));
create policy "own invoices" on public.invoices for select using (auth.uid() = user_id);

-- ============ TRIGGERS ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));

  insert into public.user_roles (user_id, role) values (new.id, 'customer');

  insert into public.subscriptions (user_id, plan) values (new.id, 'free');

  insert into public.bot_features (user_id, feature_key, enabled)
  select new.id, k, true from unnest(enum_range(null::public.bot_feature_key)) as k;

  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger bot_features_touch before update on public.bot_features for each row execute function public.touch_updated_at();

-- realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
