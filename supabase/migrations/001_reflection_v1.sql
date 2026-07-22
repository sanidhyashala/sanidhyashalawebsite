/* ===========================================================
   SANIDHYASHALA
   Reflection Module v1
   Part 1 : Schema Foundation
   =========================================================== */


/* -----------------------------------------------------------
   Enable required extension
------------------------------------------------------------ */

create extension if not exists "pgcrypto";


/* -----------------------------------------------------------
   Reflections Table
------------------------------------------------------------ */

create table if not exists public.reflections (

    id uuid primary key default gen_random_uuid(),

    prompt_id text not null,

    author_id text not null,

    author_name text not null,

    question text not null,

    content text not null,

    status text not null default 'pending',

    reviewed_by text,

    reviewed_at timestamptz,

    rejection_reason text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()

);


/* -----------------------------------------------------------
   Content Constraints
------------------------------------------------------------ */

alter table public.reflections

add constraint reflection_content_length

check (

    char_length(trim(content))

    between 20 and 3000

);


/* -----------------------------------------------------------
   Question Constraint
------------------------------------------------------------ */

alter table public.reflections

add constraint reflection_question_required

check (

    char_length(trim(question)) > 0

);


/* -----------------------------------------------------------
   Prompt Constraint
------------------------------------------------------------ */

alter table public.reflections

add constraint reflection_prompt_required

check (

    char_length(trim(prompt_id)) > 0

);


/* -----------------------------------------------------------
   Status Constraint
------------------------------------------------------------ */

alter table public.reflections

add constraint reflection_status_check

check (

    status in (

        'pending',

        'published',

        'rejected',

        'archived'

    )

);


/* -----------------------------------------------------------
   Review Consistency
------------------------------------------------------------ */

alter table public.reflections

add constraint review_consistency

check (

    (

        status='pending'

        and reviewed_at is null

        and reviewed_by is null

        and rejection_reason is null

    )

    or

    (

        status='published'

        and reviewed_at is not null

        and reviewed_by is not null

    )

    or

    (

        status='rejected'

        and reviewed_at is not null

        and reviewed_by is not null

        and rejection_reason is not null

    )

    or

    (

        status='archived'

    )

);

/* ===========================================================
   Part 2 : Enum + Performance + Triggers
   =========================================================== */


/* -----------------------------------------------------------
   Reflection Status Enum
------------------------------------------------------------ */

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'reflection_status'
    ) THEN

        CREATE TYPE reflection_status AS ENUM (

            'pending',
            'published',
            'rejected',
            'archived'

        );

    END IF;

END
$$;


/* -----------------------------------------------------------
   Convert status column to enum
------------------------------------------------------------ */

ALTER TABLE public.reflections

ALTER COLUMN status
TYPE reflection_status
USING status::reflection_status;


/* -----------------------------------------------------------
   Performance Indexes
------------------------------------------------------------ */

CREATE INDEX IF NOT EXISTS idx_reflection_status
ON public.reflections(status);


CREATE INDEX IF NOT EXISTS idx_reflection_created_at
ON public.reflections(created_at DESC);


CREATE INDEX IF NOT EXISTS idx_reflection_author
ON public.reflections(author_id);


CREATE INDEX IF NOT EXISTS idx_reflection_prompt
ON public.reflections(prompt_id);


CREATE INDEX IF NOT EXISTS idx_reflection_status_created
ON public.reflections(status, created_at DESC);


/* -----------------------------------------------------------
   Automatic updated_at Trigger
------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION update_updated_at_column()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$;


/* -----------------------------------------------------------
   Trigger
------------------------------------------------------------ */

DROP TRIGGER IF EXISTS trigger_update_updated_at
ON public.reflections;


CREATE TRIGGER trigger_update_updated_at

BEFORE UPDATE

ON public.reflections

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();

/* ===========================================================
   Part 3 : Row Level Security
   =========================================================== */


/* -----------------------------------------------------------
   Enable RLS
------------------------------------------------------------ */

ALTER TABLE public.reflections
ENABLE ROW LEVEL SECURITY;


/* -----------------------------------------------------------
   Remove old policies
------------------------------------------------------------ */

DROP POLICY IF EXISTS reflection_public_read
ON public.reflections;

DROP POLICY IF EXISTS reflection_insert
ON public.reflections;

DROP POLICY IF EXISTS reflection_update
ON public.reflections;

DROP POLICY IF EXISTS reflection_delete
ON public.reflections;


/* -----------------------------------------------------------
   Public can ONLY read published reflections
------------------------------------------------------------ */

CREATE POLICY reflection_public_read

ON public.reflections

FOR SELECT

USING (

    status = 'published'

);


/* -----------------------------------------------------------
   Nobody can insert directly from client
------------------------------------------------------------ */

CREATE POLICY reflection_insert

ON public.reflections

FOR INSERT

TO authenticated

WITH CHECK (

    false

);


/* -----------------------------------------------------------
   Nobody can update directly
------------------------------------------------------------ */

CREATE POLICY reflection_update

ON public.reflections

FOR UPDATE

TO authenticated

USING (

    false

);


/* -----------------------------------------------------------
   Nobody can delete directly
------------------------------------------------------------ */

CREATE POLICY reflection_delete

ON public.reflections

FOR DELETE

TO authenticated

USING (

    false

);