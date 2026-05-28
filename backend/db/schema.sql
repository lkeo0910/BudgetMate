create table if not exists profile (
  id serial primary key,
  brand_name text not null,
  tagline text not null,
  owner_name text not null,
  username text not null,
  email text not null,
  phone text,
  location text,
  summary text not null,
  avatar_initials text not null,
  joined_label text,
  status_label text,
  hero_metrics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id serial primary key,
  title text not null,
  subtitle text not null,
  description text not null,
  accent text not null default '#2563eb',
  link_url text,
  link_label text,
  stats jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists skills (
  id serial primary key,
  name text not null,
  category text not null,
  level integer not null check (level between 0 and 100),
  description text not null,
  sort_order integer not null default 0
);

create table if not exists education (
  id serial primary key,
  title text not null,
  institution text not null,
  period text not null,
  description text not null,
  highlights jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists leadership (
  id serial primary key,
  title text not null,
  organization text not null,
  period text not null,
  description text not null,
  impact jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists contact_messages (
  id serial primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
