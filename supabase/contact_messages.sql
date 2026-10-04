-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Messages from the website's "Contact us" form. The browser never touches this table: it posts to the
-- backend (/contact), which stores the message with the server-side secret key. Row Level Security is on
-- and there are deliberately NO policies, so the public (anon) and signed-in (authenticated) roles can
-- neither read nor write it. View messages in Table Editor (it bypasses RLS).

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name)    between 1  and 120),
  email       text not null check (char_length(email)   between 5  and 254),
  message     text not null check (char_length(message) between 10 and 2000),
  consent     boolean not null check (consent)
);

alter table public.contact_messages enable row level security;

-- The older consultation form wrote to public.consultation_requests. Once you have no use for its
-- rows you can remove it:   drop table if exists public.consultation_requests;
