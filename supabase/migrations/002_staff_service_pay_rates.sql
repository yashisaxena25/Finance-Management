alter table public.staff_services
  add column if not exists monthly_base_override numeric(12,2) check (monthly_base_override is null or monthly_base_override >= 0),
  add column if not exists deduction_rate_override numeric(12,4) check (deduction_rate_override is null or deduction_rate_override >= 0);

alter table public.salary_settings
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists free_missed_meals_per_month integer not null default 6 check (free_missed_meals_per_month >= 0);

create unique index if not exists salary_settings_global_per_household
  on public.salary_settings(user_id) where staff_id is null;
create unique index if not exists salary_settings_per_staff
  on public.salary_settings(user_id, staff_id) where staff_id is not null;
