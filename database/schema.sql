create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(100) not null,
  email varchar(254) not null,
  password_hash text not null,
  track text not null check (track in (
    'AI Engineering',
    'Machine Learning',
    'Cyber Security',
    'Cloud Computing / Data Science',
    'Software Engineering'
  )),
  role text not null default 'student' check (role in ('student', 'moderator')),
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash char(64) not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expiry_idx on sessions (expires_at);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references users (id),
  title varchar(120) not null,
  track text not null check (track in (
    'AI Engineering',
    'Machine Learning',
    'Cyber Security',
    'Cloud Computing / Data Science',
    'Software Engineering'
  )),
  kind text not null check (kind in ('Practice', 'Assignment', 'Test')),
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  instructions text not null,
  starter_code text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists challenges_track_published_idx on challenges (track, published, created_at desc);

create table if not exists student_work (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  challenge_id uuid not null references challenges (id) on delete cascade,
  source_code text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index if not exists student_work_user_idx on student_work (user_id);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  challenge_id uuid not null references challenges (id) on delete cascade,
  source_code text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  feedback text,
  submitted_at timestamptz not null default now()
);

create index if not exists submissions_user_date_idx on submissions (user_id, submitted_at desc);
create index if not exists submissions_date_idx on submissions (submitted_at desc);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  challenge_id uuid references challenges (id) on delete set null,
  event_type text not null check (event_type in (
    'challenge_opened',
    'draft_saved',
    'solution_submitted'
  )),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists activities_user_date_idx on activities (user_id, occurred_at desc);
create index if not exists activities_date_idx on activities (occurred_at desc);

create or replace function touch_student_work_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_work_updated_at on student_work;
create trigger student_work_updated_at
  before update on student_work
  for each row execute function touch_student_work_updated_at();

-- After creating the first account, promote it manually:
-- update users set role = 'moderator' where email = 'you@example.com';
