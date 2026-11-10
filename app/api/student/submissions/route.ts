import { requireRole } from "../../../lib/server/auth";
import { getPool } from "../../../lib/server/db";
import { readJson } from "../../../lib/server/http";

export async function POST(request: Request) {
  const { profile, response } = await requireRole("student");
  if (response || !profile) return response;
  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });
  if (
    typeof data.challenge_id !== "string" ||
    typeof data.source_code !== "string" ||
    !data.source_code.trim() ||
    data.source_code.length > 200_000
  ) {
    return Response.json({ error: "Enter a solution no larger than 200 KB." }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query("begin");
    const inserted = await client.query<{ id: string }>(
      `insert into submissions (user_id, challenge_id, source_code)
       select $1, c.id, $3
       from challenges c
       where c.id = $2 and c.published = true and c.track = $4
       returning id`,
      [profile.id, data.challenge_id, data.source_code, profile.track]
    );
    if (!inserted.rowCount) {
      await client.query("rollback");
      return Response.json({ error: "Challenge not found." }, { status: 404 });
    }
    await client.query(
      "insert into activities (user_id, challenge_id, event_type) values ($1, $2, 'solution_submitted')",
      [profile.id, data.challenge_id]
    );
    await client.query("commit");
    return Response.json({ ok: true }, { status: 201 });
  } catch (caught) {
    await client.query("rollback");
    console.error("Could not submit student work", caught);
    return Response.json({ error: "Could not submit your solution." }, { status: 500 });
  } finally {
    client.release();
  }
}
