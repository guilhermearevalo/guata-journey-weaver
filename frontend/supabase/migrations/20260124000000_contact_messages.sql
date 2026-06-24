-- Contact form messages submitted from /contato
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists contact_messages_is_read_idx on public.contact_messages (is_read);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

-- Enable RLS
alter table public.contact_messages enable row level security;

-- Anyone (anon) can INSERT a new contact message (the public form)
drop policy if exists "contact_messages_anon_insert" on public.contact_messages;
create policy "contact_messages_anon_insert"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated admin/team users can SELECT, UPDATE, DELETE
-- Adjust the role check to match your existing pattern (user_roles table)
drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select"
  on public.contact_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'team', 'manager')
    )
  );

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update"
  on public.contact_messages
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'team', 'manager')
    )
  );

drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete"
  on public.contact_messages
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('admin', 'team', 'manager')
    )
  );
