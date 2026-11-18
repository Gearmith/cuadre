-- Cuadre - cuentas, bolsillos/cajitas y movimientos entre cuentas.
-- Ejecutar una vez en Supabase > SQL Editor (se puede repetir sin problema).

create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 40),
  kind            text not null check (kind in ('bank', 'cash', 'credit', 'pocket')),
  parent_id       uuid references public.accounts (id) on delete cascade,
  color           text not null default 'green'
                  check (color in ('green', 'blue', 'purple', 'red', 'gold', 'slate')),
  initial_balance numeric(14, 2) not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  check ((kind = 'pocket') = (parent_id is not null)),
  check (parent_id is null or parent_id <> id)
);

create index if not exists accounts_user_idx on public.accounts (user_id, created_at);

alter table public.transactions
  add column if not exists account_id uuid references public.accounts (id) on delete restrict;

create index if not exists transactions_account_idx on public.transactions (account_id, occurred_on desc);

create table if not exists public.transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  to_account_id   uuid not null references public.accounts (id) on delete restrict,
  amount          numeric(14, 2) not null check (amount > 0),
  occurred_on     date not null default current_date,
  note            text check (char_length(note) <= 200),
  created_at      timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists transfers_user_date_idx on public.transfers (user_id, occurred_on desc, created_at desc);

grant select, insert, update, delete on public.accounts, public.transfers to authenticated;

alter table public.accounts  enable row level security;
alter table public.transfers enable row level security;

-- Comprueba que el bolsillo va dentro de una cuenta propia (que no sea otro bolsillo).
-- security definer evita que la regla de "accounts" se llame a si misma en bucle.
create or replace function public.owns_parent_account(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.accounts p
    where p.id = pid and p.user_id = (select auth.uid()) and p.kind <> 'pocket'
  );
$$;

revoke execute on function public.owns_parent_account(uuid) from public, anon;
grant execute on function public.owns_parent_account(uuid) to authenticated;

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (parent_id is null or public.owns_parent_account(parent_id))
  );

drop policy if exists "own transfers" on public.transfers;
create policy "own transfers" on public.transfers
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.accounts a where a.id = from_account_id and a.user_id = (select auth.uid()))
    and exists (select 1 from public.accounts a where a.id = to_account_id and a.user_id = (select auth.uid()))
  );

-- Un gasto o ingreso solo puede ir a una cuenta propia.
drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (account_id is null or exists (
      select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())
    ))
  );

-- Saldo de cada cuenta.
create or replace function public.account_balances()
returns table (account_id uuid, balance numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    a.id,
    a.initial_balance
      + coalesce((select sum(case when t.type = 'income' then t.amount else -t.amount end)
                  from public.transactions t where t.account_id = a.id), 0)
      + coalesce((select sum(x.amount) from public.transfers x where x.to_account_id = a.id), 0)
      - coalesce((select sum(x.amount) from public.transfers x where x.from_account_id = a.id), 0)
  from public.accounts a
  where a.user_id = (select auth.uid());
$$;

grant execute on function public.account_balances() to authenticated;

-- Total: saldos iniciales + ingresos - gastos (los movimientos entre cuentas se anulan).
drop function if exists public.balance_totals();
create function public.balance_totals()
returns table (income numeric, expense numeric, initial numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((select sum(amount) from public.transactions where type = 'income'  and user_id = (select auth.uid())), 0),
    coalesce((select sum(amount) from public.transactions where type = 'expense' and user_id = (select auth.uid())), 0),
    coalesce((select sum(initial_balance) from public.accounts where user_id = (select auth.uid())), 0);
$$;

grant execute on function public.balance_totals() to authenticated;
