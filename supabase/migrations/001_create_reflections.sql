create table public.reflections (
    id uuid primary key default gen_random_uuid(),

    author_id text not null,

    author_name text not null,

    question text not null,

    content text not null,

    status text not null default 'pending',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

alter table public.reflections
enable row level security;