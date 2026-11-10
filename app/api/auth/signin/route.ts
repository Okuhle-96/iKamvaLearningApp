import { createSession, isValidEmail, verifyPassword } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";
import { AUTHENTICATION_ENABLED } from "../../../lib/auth-config";

export async function POST(request: Request) {
  if (!AUTHENTICATION_ENABLED) {
    return Response.json({ error: "Sign-in is temporarily disabled." }, { status: 503 });
  }

  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!isValidEmail(email) || !password || password.length > 128) {
    return Response.json({ error: "Enter your email and password." }, { status: 400 });
  }

  try {
    const { rows } = await getPool().query<{ id: string; password_hash: string }>(
      "select id, password_hash from users where email = $1",
      [email]
    );
    const account = rows[0];
    if (!account || !(await verifyPassword(password, account.password_hash))) {
      return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await createSession(account.id);
    return Response.json({ ok: true });
  } catch (caught) {
    console.error("Sign-in failed", caught);
    return Response.json({ error: "Could not sign in. Please try again." }, { status: 500 });
  }
}
