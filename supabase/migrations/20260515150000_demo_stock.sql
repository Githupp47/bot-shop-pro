
-- ============ DEMO STOCK ============
create table public.demo_stock (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  quantity int not null default 0,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demo_stock enable row level security;

create policy "Users can manage their own demo stock"
  on public.demo_stock for all
  using (auth.uid() = user_id);
