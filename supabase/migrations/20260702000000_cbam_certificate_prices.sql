-- Official CBAM certificate prices published quarterly by the European Commission
create table if not exists public.cbam_certificate_prices (
  id uuid primary key default gen_random_uuid(),
  quarter text not null unique check (quarter ~ '^\d{4}-Q[1-4]$'),
  price numeric not null check (price > 0),
  published_at date not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

alter table public.cbam_certificate_prices enable row level security;

-- Authenticated users may read published prices; INSERT/UPDATE reserved for service role (no policy)
create policy "authenticated read cbam_certificate_prices"
  on public.cbam_certificate_prices for select
  to authenticated
  using (true);

insert into public.cbam_certificate_prices (quarter, price, published_at, source_url)
values (
  '2026-Q1',
  75.36,
  '2026-04-07',
  'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en'
)
on conflict (quarter) do nothing;

insert into public.cbam_certificate_prices (quarter, price, published_at, source_url)
values ('2026-Q2', 70.07, '2026-07-06', 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en')
on conflict (quarter) do nothing;
