-- Control de gastos - esquema de base de datos para Supabase.
-- Ejecuta este archivo completo una sola vez en: Supabase > SQL Editor > New query > Run.

-- --- Movimientos (gastos e ingresos) ----
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        text not null check (type in ('expense', 'income')),
  amount      numeric(14, 2) not null check (amount > 0),
  category    text not null,
  note        text check (char_length(note) <= 200),
  occurred_on date not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);

-- --- Deudas (lo que debo y lo que me deben) ----
create table if not exists public.debts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  direction   text not null check (direction in ('i_owe', 'owed_to_me')),
  person      text not null check (char_length(person) between 1 and 80),
  description text check (char_length(description) <= 200),
  amount      numeric(14, 2) not null check (amount > 0),
  due_on      date,
  created_at  timestamptz not null default now()
);

create index if not exists debts_user_idx on public.debts (user_id, created_at desc);

-- --- Abonos a deudas ----
create table if not exists public.debt_payments (
  id         uuid primary key default gen_random_uuid(),
  debt_id    uuid not null references public.debts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount     numeric(14, 2) not null check (amount > 0),
  paid_on    date not null default current_date,
  note       text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists debt_payments_debt_idx on public.debt_payments (debt_id, paid_on desc);

-- --- Seguridad: cada persona solo ve y toca sus propios datos ----
-- Permisos de la app sobre las tablas (los proyectos nuevos de Supabase no los dan solos).
-- Las reglas de abajo (RLS) siguen limitando cada fila a su propio usuario.
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.transactions, public.debts, public.debt_payments
  to authenticated;

alter table public.transactions  enable row level security;
alter table public.debts         enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own debts" on public.debts;
create policy "own debts" on public.debts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own debt payments" on public.debt_payments;
create policy "own debt payments" on public.debt_payments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.debts d where d.id = debt_id and d.user_id = (select auth.uid()))
  );

-- --- Totales historicos (balance general) ----
-- security invoker: respeta las reglas de seguridad de arriba.
create or replace function public.balance_totals()
returns table (income numeric, expense numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0)  as income,
    coalesce(sum(amount) filter (where type = 'expense'), 0) as expense
  from public.transactions
  where user_id = (select auth.uid());
$$;

grant execute on function public.balance_totals() to authenticated;
