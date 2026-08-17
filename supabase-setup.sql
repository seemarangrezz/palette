-- Studio Admin — run this once in Supabase → SQL Editor → New query → Run.

-- 1. The table that holds your website's content (one row for your
--    private draft, one row for what the public sees).
create table if not exists public.site_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_state enable row level security;

-- 2. Anyone may read the published version. Nobody may read your draft
--    unless they are signed in as you.
drop policy if exists "published is public" on public.site_state;
create policy "published is public" on public.site_state
  for select using (id = 'published');

drop policy if exists "signed in can read all" on public.site_state;
create policy "signed in can read all" on public.site_state
  for select to authenticated using (true);

-- 3. Only a signed-in admin may write anything.
drop policy if exists "signed in can write" on public.site_state;
create policy "signed in can write" on public.site_state
  for all to authenticated using (true) with check (true);

-- 4. The bucket your photographs live in: public to look at,
--    private to add to.
insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', true)
on conflict (id) do update set public = true;

drop policy if exists "media is public" on storage.objects;
create policy "media is public" on storage.objects
  for select using (bucket_id = 'gallery-media');

drop policy if exists "signed in can upload media" on storage.objects;
create policy "signed in can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery-media');

drop policy if exists "signed in can change media" on storage.objects;
create policy "signed in can change media" on storage.objects
  for update to authenticated using (bucket_id = 'gallery-media');

drop policy if exists "signed in can delete media" on storage.objects;
create policy "signed in can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery-media');
