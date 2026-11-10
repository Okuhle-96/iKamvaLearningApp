import { createSession, hashPassword, isValidEmail } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";
import { STREAMS } from "../../../lib/types";
import { AUTHENTICATION_ENABLED } from "../../../lib/auth-config";

export async function POST(request: Request) {
  if (!AUTHENTICATION_ENABLED) {
    return Response.json({ error: "Account creation is temporarily disabled." }, { status: 503 });
  }

  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });

  const fullName = typeof data.full_name === "string" ? data.full_name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const track = data.track;

  if (fullName.length < 2 || fullName.length > 100) {
    return Response.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
  }
  if (!isValidEmail(email) || email.length > 254) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return Response.json({ error: "Password must be between 8 and 128 characters." }, { status: 400 });
  }
  if (typeof track !== "string" || !STREAMS.includes(track as (typeof STREAMS)[number])) {
    return Response.json({ error: "Choose a valid learning stream." }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const passwordHash = await hashPassword(password);
    const { rows } = await client.query<{ id: string }>(
      `insert into users (full_name, email, password_hash, track)
       values ($1, $2, $3, $4)
       returning id`,
      [fullName, email, passwordHash, track]
    );
    await client.query("commit");
    await createSession(rows[0].id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (caught) {
    await client.query("rollback");
    if (
      typeof caught === "object" &&
      caught !== null &&
      "code" in caught &&
      caught.code === "23505"
    ) {
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Student sign-up failed", caught);
    return Response.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  } finally {
    client.release();
  }
}
