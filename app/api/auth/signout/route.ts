import { clearSession } from "../../../lib/server/auth";
import { jsonError } from "../../../lib/server/http";

export async function POST() {
  try {
    await clearSession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Sign-out failed", error);
    return jsonError(error, "Could not sign out.");
  }
}
