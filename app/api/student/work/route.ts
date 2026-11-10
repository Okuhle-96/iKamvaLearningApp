import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";

export async function PUT(request: Request) {
  const { profile, response } = await requireRole("student");
  if (response || !profile) return response;
  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });
  if (
    typeof data.challenge_id !== "string" ||
    typeof data.source_code !== "string" ||
    data.source_code.length > 200_000
  ) {
    return Response.json({ error: "Invalid work data or solution exceeds 200 KB." }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const saved = await client.query(
      `insert into student_work (user_id, challenge_id, source_code)
       select $1, c.id, $3
       from challenges c
       where c.id = $2 and c.published = true and c.track = $4
       on conflict (user_id, challenge_id)
       do update set source_code = excluded.source_code, updated_at = now()
       returning id`,
      [profile.id, data.challenge_id, data.source_code, profile.track]
    );
    if (!saved.rowCount) {
      await client.query("rollback");
      return Response.json({ error: "Challenge not found." }, { status: 404 });
    }
    await client.query(
      "insert into activities (user_id, challenge_id, event_type) values ($1, $2, 'draft_saved')",
      [profile.id, data.challenge_id]
    );
    await client.query("commit");
    return Response.json({ ok: true });
  } catch (caught) {
    await client.query("rollback");
    console.error("Could not save student work", caught);
    return Response.json({ error: "Could not save your draft." }, { status: 500 });
  } finally {
    client.release();
  }
}
