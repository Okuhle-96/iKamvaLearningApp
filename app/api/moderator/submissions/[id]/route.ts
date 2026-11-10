import { requireRole } from "../../../../lib/server/auth";
import { getPool } from "../../../../lib/server/db";
import { readJson } from "../../../../lib/server/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { profile, response } = await requireRole("moderator");
  if (response || !profile) return response;
  const { id } = await params;
  try {
    const { rows } = await getPool().query(
      `select id, user_id, challenge_id, source_code, status, feedback, submitted_at
       from submissions where id = $1`,
      [id]
    );
    if (!rows[0]) return Response.json({ error: "Submission not found." }, { status: 404 });
    return Response.json({ submission: rows[0] });
  } catch (caught) {
    console.error("Could not load submission for review", caught);
    return Response.json({ error: "Could not load this submission." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { profile, response } = await requireRole("moderator");
  if (response || !profile) return response;
  const { id } = await params;
  const { data, error } = await readJson(request);
  if (error || !data) return Response.json({ error }, { status: 400 });
  if (
    typeof data.feedback !== "string" ||
    data.feedback.length > 5_000
  ) {
    return Response.json({ error: "Feedback must be no more than 5,000 characters." }, { status: 400 });
  }

  try {
    const { rowCount } = await getPool().query(
      `update submissions set status = 'reviewed', feedback = $2
       where id = $1`,
      [id, data.feedback.trim() || null]
    );
    if (!rowCount) return Response.json({ error: "Submission not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (caught) {
    console.error("Could not save submission review", caught);
    return Response.json({ error: "Could not save the review." }, { status: 500 });
  }
}
