alter table public.check_inler
  add column gizli_mi boolean not null default false;

alter table public.profiller
  add column varsayilan_gizli boolean not null default false;
