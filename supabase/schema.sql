-- Feiticeiros & Maldições — schema base para produção
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'player' check (role in ('player','gm','admin')),
  created_at timestamptz default now()
);

create table if not exists credit_wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance int not null default 5,
  first_character_free_used boolean not null default false,
  updated_at timestamptz default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  campaign_id uuid,
  payload jsonb not null default '{}',
  locked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists character_roll_sets (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references characters(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  rolls jsonb not null,
  free_roll boolean not null default false,
  credit_cost int not null default 0,
  locked boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists rule_entries (
  id text primary key,
  type text not null,
  category text,
  name text not null,
  source_book text,
  chapter text,
  section text,
  page_start int,
  page_end int,
  original_text text,
  parsed_fields jsonb not null default '{}',
  review_status text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists custom_cursed_techniques (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  concept text,
  base_function text,
  raw_text text,
  author_id uuid references profiles(id) on delete set null,
  review_status text not null default 'pending' check (review_status in ('draft','pending','approved','rejected')),
  approved_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists custom_technique_features (
  id uuid primary key default gen_random_uuid(),
  technique_id uuid references custom_cursed_techniques(id) on delete cascade,
  feature_type text not null check (feature_type in ('base','passive','active','domain','vow')),
  name text,
  grade text,
  cost text,
  action text,
  target text,
  area text,
  duration text,
  description text,
  parsed_effects jsonb default '[]',
  review_status text default 'pending'
);

create or replace function is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function grant_credits(target_user_id uuid, amount int, reason text)
returns void language plpgsql security definer as $$
begin
  if not is_admin() then raise exception 'not authorized'; end if;
  insert into credit_wallets(user_id,balance) values(target_user_id, greatest(amount,0))
  on conflict(user_id) do update set balance = credit_wallets.balance + amount, updated_at = now();
  insert into credit_transactions(user_id, amount, reason, created_by) values(target_user_id, amount, reason, auth.uid());
end;
$$;

create or replace function consume_credit(target_user_id uuid, amount int, reason text)
returns void language plpgsql security definer as $$
declare current_balance int;
begin
  select balance into current_balance from credit_wallets where user_id = target_user_id for update;
  if current_balance is null then
    insert into credit_wallets(user_id,balance) values(target_user_id,5);
    current_balance := 5;
  end if;
  if current_balance < amount then raise exception 'insufficient credits'; end if;
  update credit_wallets set balance = balance - amount, updated_at = now() where user_id = target_user_id;
  insert into credit_transactions(user_id, amount, reason, created_by) values(target_user_id, -amount, reason, auth.uid());
end;
$$;

create or replace function roll_character_attributes(character_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  owner uuid;
  is_free boolean;
  cost int;
  result jsonb := '[]'::jsonb;
  dice int[];
  i int;
  dropped int;
  total int;
begin
  select owner_id into owner from characters where id = character_id;
  if owner is null or owner <> auth.uid() then raise exception 'not authorized'; end if;
  insert into credit_wallets(user_id,balance) values(auth.uid(),5) on conflict do nothing;
  select not first_character_free_used into is_free from credit_wallets where user_id=auth.uid();
  cost := case when is_free then 0 else 1 end;
  if cost > 0 then perform consume_credit(auth.uid(), 1, 'Reroll de atributos'); end if;
  for i in 1..6 loop
    dice := array[1+floor(random()*6)::int,1+floor(random()*6)::int,1+floor(random()*6)::int,1+floor(random()*6)::int];
    select min(x) into dropped from unnest(dice) x;
    select sum(x)-dropped into total from unnest(dice) x;
    result := result || jsonb_build_array(jsonb_build_object('dice',dice,'dropped',dropped,'total',total));
  end loop;
  update credit_wallets set first_character_free_used = true, updated_at=now() where user_id=auth.uid();
  insert into character_roll_sets(character_id,user_id,rolls,free_roll,credit_cost) values(character_id, auth.uid(), result, is_free, cost);
  return result;
end;
$$;

alter table profiles enable row level security;
alter table credit_wallets enable row level security;
alter table credit_transactions enable row level security;
alter table characters enable row level security;
alter table character_roll_sets enable row level security;
alter table rule_entries enable row level security;
alter table custom_cursed_techniques enable row level security;
alter table custom_technique_features enable row level security;

drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());

drop policy if exists wallet_self on credit_wallets;
create policy wallet_self on credit_wallets for select using (user_id = auth.uid() or is_admin());

drop policy if exists transactions_self on credit_transactions;
create policy transactions_self on credit_transactions for select using (user_id = auth.uid() or is_admin());

drop policy if exists characters_owner on characters;
create policy characters_owner on characters for all using (owner_id = auth.uid() or is_admin()) with check (owner_id = auth.uid() or is_admin());

drop policy if exists rolls_owner on character_roll_sets;
create policy rolls_owner on character_roll_sets for select using (user_id = auth.uid() or is_admin());

drop policy if exists rules_public on rule_entries;
create policy rules_public on rule_entries for select using (review_status = 'approved' or is_admin());
create policy rules_admin_modify on rule_entries for all using (is_admin()) with check (is_admin());

drop policy if exists techniques_public on custom_cursed_techniques;
create policy techniques_public on custom_cursed_techniques for select using (review_status = 'approved' or author_id = auth.uid() or is_admin());
create policy techniques_author_insert on custom_cursed_techniques for insert with check (author_id = auth.uid() or is_admin());
create policy techniques_author_update on custom_cursed_techniques for update using (author_id = auth.uid() or is_admin()) with check (author_id = auth.uid() or is_admin());
