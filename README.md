# iKamva Coding Institute

A coding institute learning workspace for AI Engineering, Machine Learning,
Cyber Security, Cloud Computing / Data Science, and Software Engineering.
Students have private accounts, saved work, submissions, and feedback.
Moderators can view institute-wide student progress, publish challenges, and
review code.

## Self-managed PostgreSQL setup

The app connects directly to a PostgreSQL database using a server-only
`DATABASE_URL`. Authentication uses salted scrypt password hashes and
server-managed, HTTP-only database sessions. All account and role checks run in
the app's server API; never expose the database connection string to the browser.

### Option A: Install PostgreSQL directly on Windows

1. Install PostgreSQL for Windows and pgAdmin if they are not installed yet.
   Leave the default port at `5432` and make sure the PostgreSQL service is
   running.
2. Open pgAdmin and connect to your local PostgreSQL server. In its Query Tool,
   create the application login and database (the password below is for local
   development only):

   ```sql
   create role techforge_app login password 'dev_only_change_me';
   create database techforge owner techforge_app;
   ```

3. In pgAdmin, select the `techforge` database, open its Query Tool, and run
   [`database/schema.sql`](./database/schema.sql).
4. In PowerShell, from the project folder, create the app's local environment
   file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   The example connection string matches the role and password above. Keep
   `.env.local` private.
5. Start or restart the app:

   ```powershell
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000), create your account,
   then promote it to moderator using the SQL instructions below.

Change the example password before using the database beyond local development.
After changing it, update the password in `.env.local` too.

### Option B: Run PostgreSQL with Docker

1. Install and start Docker Desktop.
2. Copy `.env.example` to `.env.local`.
3. Start the database:

   ```bash
   docker compose up -d
   ```

   On first startup, Docker creates the tables from
   [`database/schema.sql`](./database/schema.sql).
4. Install and run the app:

   ```bash
   npm install
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) and create your account.
6. Make your account a moderator using the SQL instructions below.

The compose file uses a development-only password and binds PostgreSQL to
localhost. Change it before using Docker for anything beyond local development.
If you change the schema later, apply it to an existing database with:

```bash
Get-Content .\database\schema.sql | docker compose exec -T db psql -U techforge_app -d techforge
```

### Option C: Use an existing PostgreSQL server

Create a database and app-specific login in your PostgreSQL server, apply
[`database/schema.sql`](./database/schema.sql), then set these values in
`.env.local`:

```env
DATABASE_URL=postgres://APP_USER:APP_PASSWORD@YOUR_DB_HOST:5432/techforge
DATABASE_SSL=true
```

Use the SSL mode required by your provider. Keep `.env.local` private and set
the same variables in your deployment provider's server-side environment
settings. For students on separate devices, deploy the Next.js app and use a
database host reachable by that server; a localhost-only database works only
for development on that computer.

### Promote a moderator

Create your account through the app first. Then run this query using a trusted
PostgreSQL administrator connection, replacing the email with your account:

```sql
update users set role = 'moderator' where email = 'you@example.com';
```

Never offer moderator role selection during public signup. Only trusted
administrators should be allowed to run this query.

## Current MVP scope

- Email/password sign-up and sign-in, with stream selection (temporarily disabled; set `AUTHENTICATION_ENABLED` in `app/lib/auth-config.ts` to `true` to restore it).
- Role-specific student and moderator dashboards.
- Stream-specific published challenges and moderator challenge publishing.
- Per-student saved code drafts, submissions, feedback, and activity history.
- Moderator roster, submission review, stream filtering, and recent activity.
- Server-side authorization: students can access only their own records;
  moderators can view institute-wide progress.

Code editing, persistence, and submissions are connected. Executing untrusted
student code is not enabled; safely offering that requires an isolated,
resource-limited code runner.
