-- Psyyogshala yoga studio booking schema.
-- Membership type MONTHLY is used in place of the requested MONTHLY_ label.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

create type public.membership_type as enum (
  'DROP_IN',
  'EIGHT_CLASS',
  'TWELVE_CLASS',
  'MONTHLY',
  '3MONTH'
);

create type public.membership_status as enum (
  'ACTIVE',
  'EXPIRED'
);

create type public.class_mode as enum (
  'IN_STUDIO',
  'ONLINE'
);

create type public.booking_status as enum (
  'CONFIRMED',
  'CANCELLED'
);

create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  type public.membership_type not null,
  credits_remaining integer not null default 0,
  start_date date not null,
  end_date date not null,
  status public.membership_status not null default 'ACTIVE',
  constraint memberships_credits_nonnegative check (credits_remaining >= 0),
  constraint memberships_date_range check (end_date >= start_date)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instructor text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  mode public.class_mode not null,
  capacity integer not null,
  meeting_link text,
  constraint classes_capacity_positive check (capacity > 0),
  constraint classes_time_range check (end_time > start_time),
  constraint classes_online_has_link check (
    mode <> 'ONLINE' or meeting_link is not null
  )
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  practitioner_id uuid not null references public.practitioners (id) on delete cascade,
  status public.booking_status not null default 'CONFIRMED',
  booked_at timestamptz not null default now()
);

create index memberships_practitioner_id_idx on public.memberships (practitioner_id);
create index memberships_active_lookup_idx
  on public.memberships (practitioner_id, status, start_date, end_date);

create index bookings_class_id_idx on public.bookings (class_id);
create index bookings_practitioner_id_idx on public.bookings (practitioner_id);
create index bookings_class_confirmed_idx
  on public.bookings (class_id)
  where status = 'CONFIRMED';

create unique index bookings_one_confirmed_per_class_idx
  on public.bookings (class_id, practitioner_id)
  where status = 'CONFIRMED';

create index classes_start_time_idx on public.classes (start_time);

-- Time-based passes do not consume credits. Pack / drop-in types do.
create or replace function private.membership_consumes_credits(p_type public.membership_type)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_type in ('DROP_IN', 'EIGHT_CLASS', 'TWELVE_CLASS');
$$;

create or replace function private.find_membership_for_booking(
  p_practitioner_id uuid,
  p_as_of timestamptz,
  p_active_only boolean default true
)
returns public.memberships
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_membership public.memberships;
  v_as_of_date date := (timezone('utc', p_as_of))::date;
begin
  select m.*
  into v_membership
  from public.memberships m
  where m.practitioner_id = p_practitioner_id
    and m.start_date <= v_as_of_date
    and m.end_date >= v_as_of_date
    and (not p_active_only or m.status = 'ACTIVE')
  order by
    private.membership_consumes_credits(m.type) desc,
    m.credits_remaining asc,
    m.end_date asc
  limit 1
  for update of m;

  return v_membership;
end;
$$;

create or replace function private.enforce_booking_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class public.classes;
  v_confirmed_count integer;
  v_membership public.memberships;
  v_as_of timestamptz;
begin
  if tg_op = 'UPDATE'
     and old.status = 'CONFIRMED'
     and new.status = 'CANCELLED' then
    v_membership := private.find_membership_for_booking(old.practitioner_id, old.booked_at, false);

    if v_membership.id is not null
       and private.membership_consumes_credits(v_membership.type) then
      update public.memberships
      set credits_remaining = credits_remaining + 1
      where id = v_membership.id;
    end if;

    return new;
  end if;

  if new.status is distinct from 'CONFIRMED' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'CONFIRMED' then
    if old.class_id is distinct from new.class_id
       or old.practitioner_id is distinct from new.practitioner_id then
      raise exception 'Confirmed bookings cannot change class or practitioner. Cancel and rebook.'
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  select c.*
  into v_class
  from public.classes c
  where c.id = new.class_id
  for update of c;

  if not found then
    raise exception 'Class not found.'
      using errcode = 'P0001';
  end if;

  select count(*)
  into v_confirmed_count
  from public.bookings b
  where b.class_id = new.class_id
    and b.status = 'CONFIRMED'
    and b.id is distinct from new.id;

  if v_confirmed_count >= v_class.capacity then
    raise exception 'Class is full. Capacity % already reached.', v_class.capacity
      using errcode = 'P0001';
  end if;

  v_as_of := coalesce(new.booked_at, now());
  v_membership := private.find_membership_for_booking(new.practitioner_id, v_as_of);

  if v_membership.id is null then
    raise exception 'No active membership covering this booking date. Membership is missing or expired.'
      using errcode = 'P0001';
  end if;

  if private.membership_consumes_credits(v_membership.type) then
    if v_membership.credits_remaining <= 0 then
      raise exception 'Booking blocked: 0 credits remaining on the active membership.'
        using errcode = 'P0001';
    end if;

    update public.memberships
    set credits_remaining = credits_remaining - 1
    where id = v_membership.id
      and credits_remaining > 0;

    if not found then
      raise exception 'Booking blocked: 0 credits remaining on the active membership.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.membership_consumes_credits(public.membership_type) from public;
revoke all on function private.find_membership_for_booking(uuid, timestamptz, boolean) from public;
revoke all on function private.enforce_booking_rules() from public;

create trigger bookings_enforce_rules
before insert or update of class_id, practitioner_id, status, booked_at
on public.bookings
for each row
execute function private.enforce_booking_rules();

create or replace function private.expire_memberships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.end_date < current_date then
    new.status := 'EXPIRED';
  end if;

  return new;
end;
$$;

revoke all on function private.expire_memberships() from public;

create trigger memberships_auto_expire
before insert or update of start_date, end_date, status
on public.memberships
for each row
execute function private.expire_memberships();

alter table public.practitioners enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.bookings enable row level security;

-- Public schedule is readable; writes go through the service role until auth is wired.
create policy classes_public_read
  on public.classes
  for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.classes to anon, authenticated, service_role;
grant all on table public.practitioners to service_role;
grant all on table public.memberships to service_role;
grant all on table public.classes to service_role;
grant all on table public.bookings to service_role;
grant usage on type public.membership_type to anon, authenticated, service_role;
grant usage on type public.membership_status to anon, authenticated, service_role;
grant usage on type public.class_mode to anon, authenticated, service_role;
grant usage on type public.booking_status to anon, authenticated, service_role;
