import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";

export async function POST(request: Request) {
  const { profile, response } = await requireRole("student");
  if (response || !profile) return response;
  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });
  if (data.event_type !== "challenge_opened" || typeof data.challenge_id !== "string") {
    return Response.json({ error: "Invalid activity event." }, { status: 400 });
  }

  try {
    const { rowCount } = await getPool().query(
      `insert into activities (user_id, challenge_id, event_type, details)
       select $1, c.id, 'challenge_opened', jsonb_build_object('title', c.title)
       from challenges c
       where c.id = $2 and c.published = true and c.track = $3`,
      [profile.id, data.challenge_id, profile.track]
    );
    if (!rowCount) return Response.json({ error: "Challenge not found." }, { status: 404 });
    return Response.json({ ok: true }, { status: 201 });
  } catch (caught) {
    console.error("Could not record student activity", caught);
    return Response.json({ error: "Could not record this activity." }, { status: 500 });
  }
}
