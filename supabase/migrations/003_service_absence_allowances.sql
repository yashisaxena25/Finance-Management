alter table public.salary_settings
  add column if not exists free_cleaning_days_per_month integer not null default 2 check (free_cleaning_days_per_month >= 0);
